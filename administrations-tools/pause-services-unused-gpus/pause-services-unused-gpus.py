import subprocess
import logging
import json

from prometheus_api_client import PrometheusConnect
import kubernetes


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Prometheus config
prom = PrometheusConnect(url="http://prometheus-server.prometheus",
                         disable_ssl=True)

# Kube API config
kubernetes.config.load_incluster_config()
kube_core_api = kubernetes.client.CoreV1Api()

# Get list of pods that have been reserving a GPU for at least n hours
N_HOURS_RES = 2  # Check last N hours
N_DATA_POINT_MIN = N_HOURS_RES * 60 * 0.9  # 10% error margin to account for measurement error

query_up = f'''
count_over_time(DCGM_FI_DEV_GPU_UTIL{{namespace=~".*",
                                      pod=~".*",
                                      job!="opencost"
                                      }}[{N_HOURS_RES}h]) > {N_DATA_POINT_MIN}
'''
res_up = prom.custom_query(query_up)
pods_res_up = [(svc["metric"]["pod"], svc["metric"]["namespace"])
               for svc in res_up if "pod" in svc["metric"]]

# Get list of pods for which there is no sign of GPU activity in the last n hours
query_no_usage = f'''
sum_over_time(DCGM_FI_DEV_GPU_UTIL{{namespace=~".*",
                                    pod=~".*",
                                    job!="opencost"
                                    }}[{N_HOURS_RES}h]) == 0
'''
no_usage = prom.custom_query(query_no_usage)
pods_no_usage = [(svc["metric"]["pod"], svc["metric"]["namespace"])
                 for svc in no_usage if "pod" in svc["metric"]]

# Get list of pods that match the two criterion
pods_to_pause = list(set(pods_res_up) & set(pods_no_usage))

# Filter out non-running pods
pods_to_pause = [(pod, ns) for pod, ns in pods_to_pause
                 if kube_core_api.read_namespaced_pod(name=pod, namespace=ns).status.phase == 'Running']

# Pause helm releases that match the two criterions
cmd_helm_repo_add = 'helm repo add inseefrlab-datascience https://inseefrlab.github.io/helm-charts-interactive-services'
subprocess.run(cmd_helm_repo_add.split(" "))
for pod in pods_to_pause:
    # Extract relevant metadata from pod
    release_name = pod[0].split('-0')[0]
    chart = '-'.join(release_name.split('-')[:-1])
    namespace = pod[1]
    # Match corresponding helm release
    helm_ls = subprocess.run(['helm', 'ls', '-n', namespace, '--output', 'json'],
                             capture_output=True, text=True)
    ns_releases = [rl for rl in json.loads(helm_ls.stdout) if rl['name'] == release_name]
    if ns_releases:
        # Extract chart metadata
        chart_splitted = ns_releases[0]["chart"].split('-')
        chart_name = '-'.join(chart_splitted[:-1])
        chart_version = chart_splitted[-1]
        # Launch pause command
        cmd = f"helm upgrade {release_name} inseefrlab-datascience/{chart_name} --version {chart_version} --history-max 0 --namespace={namespace} --reuse-values --set global.suspend=true"
        logging.info(f"Running command : {cmd}")
        subprocess.run(cmd.split(" "), stdout=subprocess.DEVNULL)
    else:
        logging.info(f"Pod {pod[0]} in namespace {namespace} is not associated to any helm release.")