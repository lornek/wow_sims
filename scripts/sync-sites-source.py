"""Publish the current source tree to the retained Sites Git mirror without generated archive history.
Run interactively; paste the Sites credential JSON at the hidden prompt. Prints the pushed SHA.
Never embeds or writes credentials. Does not modify the working tree or GitHub main history.
"""
import base64,getpass,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parent.parent
credential=json.loads(getpass.getpass('Credential JSON: '))
header='Authorization: Basic '+base64.b64encode(('x-access-token:'+credential['token']).encode()).decode()
base=['git','-c','http.extraHeader='+header,'-c','http.postBuffer=157286400']
def run(args,**kwargs):
    result=subprocess.run(args,cwd=root,**kwargs)
    if result.returncode:
        raise SystemExit('Source synchronization failed (git exit '+str(result.returncode)+'). Refresh the short-lived write credential or check the Git service. Command arguments are intentionally withheld.')
    return result
head=run(['git','rev-parse','HEAD'],capture_output=True,text=True).stdout.strip()
tree=run(['git','rev-parse','HEAD^{tree}'],capture_output=True,text=True).stdout.strip()
line=run(base+['ls-remote',credential['remote_url'],'refs/heads/'+credential['branch']],capture_output=True,text=True).stdout.strip()
parent=line.split()[0] if line else None
if parent:run(base+['fetch','--quiet',credential['remote_url'],credential['branch']],stdout=subprocess.DEVNULL)
args=['git','commit-tree',tree]
if parent:args+=['-p',parent]
sha=run(args,input='Publish source tree matching GitHub '+head+'\n',capture_output=True,text=True).stdout.strip()
run(base+['push','--quiet',credential['remote_url'],sha+':'+credential['branch']])
run(['git','update-ref','refs/heads/sites-source',sha])
run(['git','push','--quiet','origin','refs/heads/sites-source:refs/heads/sites-source'])
print(json.dumps({'commit_sha':sha,'github_main_commit':head,'source_tree':tree}))
