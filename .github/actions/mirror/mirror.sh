#!/bin/sh

set -eu

echo "$rsa"                                                           > /etc/ssh/codecommit
chmod 600 /etc/ssh/codecommit
echo "Host git-codecommit.eu-west-1.amazonaws.com"                    > /etc/ssh/ssh_config
echo " User $username"                                                >> /etc/ssh/ssh_config
echo " StrictHostKeyChecking no"                                      >> /etc/ssh/ssh_config
echo " IdentityFile /etc/ssh/codecommit"                              >> /etc/ssh/ssh_config
git remote add mirror $targetrepo
git push mirror -f

