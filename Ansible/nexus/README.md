```bash
python3 -m venv myenv
source myenv/bin/activate
pip install requirements.txt
```

```bash
ansible-galaxy role install geerlingguy.java
ansible-galaxy role install ansible-ThoTeam.nexus3-oss
```


```bash
ansible-playbook -i invnetory.ini setup.yml
ansible-playbook -i invnetory.ini configure_nexus.yml
```