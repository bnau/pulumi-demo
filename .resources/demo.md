### Installation bitnami

```shell
helm repo add bitnami https://charts.bitnami.com/bitnami
```

### Template à importer
* imp
* fnb
* bdd
* cred
* fna
* app

### Lancer la démo
```
asciinema play .resources/demo.cast
```

Ça exécute les commandes suivantes
```
pulumi stack init dev
export PULUMI_CONFIG_PASSPHRASE=123
pulumi preview
pulumi config set dbUser demo
pulumi config set --secret dbPassword my-password
pulumi up
```
