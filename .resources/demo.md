### Template à importer
* fnb
* bdd
* imp
* cred
* dbu
* dbp
* fna
* app
Rajouter un `export` avant le `const url = app(dbHost);`

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
