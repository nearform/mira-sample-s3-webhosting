import { MiraStack, AutoDeleteBucket } from 'mira'
import { Construct } from '@aws-cdk/core'
import {
  BucketDeployment,
  Source as S3DeploymentSource
} from '@aws-cdk/aws-s3-deployment'
import * as path from 'path'

export default class S3Webhosting extends MiraStack {
  constructor (parent: Construct) {
    super(parent, S3Webhosting.name)
    const bucketProps = {
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html'
    }
    const siteBucket = new AutoDeleteBucket(this, 'SiteBucket', bucketProps)
    this.addOutput('WebsiteURL', siteBucket.bucketWebsiteUrl)

    const webAppPath = path.join(__dirname, '..', '..', 'web-app')
    new BucketDeployment(this, 'Deployment', {
      destinationBucket: siteBucket,
      sources: [
        S3DeploymentSource.asset(webAppPath)
      ]
    })
  }
}
