# Yearn Finance Packages

> monorepo/packages

## Development

```bash
#!/bin/bash
mkdir -p yearn-mono
cd yearn-mono
git init
GIT_AUTHOR_DATE="Fri, 01 Jan 2021 00:00:00 +0000" GIT_COMMITTER_DATE="Fri, 01 Jan 2021 00:00:00 +0000" git commit --allow-empty --allow-empty-message -m ''
git subtree add --prefix=bonded-stealth-tx https://github.com/lbertenasco/bonded-stealth-tx c318d42ceb28882067c0535624bd3a8a0a08f55b
git subtree add --prefix=contract-utils https://github.com/lbertenasco/contract-utils 301ccc066458bd35393ea9a14979324326744f29

# scaffold monorepo 
echo "init monorepo scaffolding...."
npm init -y
npm i -D lerna

cat <<'EOF' > lerna.json
{
  "packages": [
    "bonded-stealth-tx",
    "contract-utils"
  ],
  "version": "0.0.0"
}
EOF


lerna bootstrap --no-ci --hoist --loglevel warn --concurrency 4 || exit 1
echo "PASS: boostrap successful"
# remove husky && postInstall scripts
```

### License

AGPL-3.0
