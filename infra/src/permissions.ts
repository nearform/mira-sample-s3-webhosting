'use strict';
import { Construct } from '@aws-cdk/core'
import { DeploymentPermissions, MiraApp } from 'mira'
import { PolicyStatement, Role} from '@aws-cdk/aws-iam'
import { MiraConfig } from 'mira'
export default class CustomPermissions extends DeploymentPermissions {
  constructor(parent: Construct) {
    super(parent)
    const account = MiraConfig.getEnvironment()
    const baseProject = MiraApp.getBaseStackName()
    this.role.addToPolicy(new PolicyStatement({
      actions: [
        's3:CreateBucket',
        's3:DeleteBucket',
        's3:DeleteBucketPolicy',
        's3:GetBucketPolicy',
        's3:PutBucketPolicy',
        's3:PutBucketWebsite',
        's3:DeleteObject',
        's3:GetObject',
        's3:ListBucket',
        's3:PutObject'
      ],
      resources: [
        `arn:aws:s3:::${baseProject.toLowerCase()}-*`
      ]
    }))

    this.role.addToPolicy(new PolicyStatement({
      actions: [
        'iam:CreateRole',
        'iam:DeleteRole',
        'iam:AttachRolePolicy',
        'iam:DeleteRolePolicy',
        'iam:DetachRolePolicy',
        'iam:GetRole',
        'iam:GetRolePolicy',
        'iam:PassRole',
        'iam:PutRolePolicy'
      ],
      resources: [
        `arn:aws:iam::${account.env.account}:role/${baseProject}-*`
      ]
    }))
    // ## Lambda
    this.role.addToPolicy(new PolicyStatement({
      actions: [
        'lambda:CreateFunction',
        'lambda:DeleteFunction',
        'lambda:GetFunctionConfiguration',
        'lambda:InvokeFunction',
        'lambda:Update*'
      ],
      resources: [
        `arn:aws:lambda:${account.env.region}:${account.env.account}:function:${baseProject}-*`
      ]
    }))
  }
}
