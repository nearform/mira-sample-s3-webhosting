import { MiraStack, AutoDeleteBucket, CustomCertificate, CustomDomain, MiraConfig, Account } from 'mira'
import { Construct } from '@aws-cdk/core'
import {
  BucketDeployment,
  Source as S3DeploymentSource
} from '@aws-cdk/aws-s3-deployment'
import {
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  OriginProtocolPolicy,
  SecurityPolicyProtocol,
  SSLMethod
} from '@aws-cdk/aws-cloudfront'
import * as path from 'path'

interface CertificateConfigProps {
  certificateArn: string
  webAppUrl: string
}

interface AccountWithDomainSettings extends Account {
  withDomain?: boolean
  webAppUrl?: string
}

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

    const config = MiraConfig.getEnvironment() as AccountWithDomainSettings

    let distributionDomainName
    if (config.withDomain) {
      if (!config.webAppUrl) {
        throw new Error('"webAppUrl" config is required when "withDomain" is true')
      }
      distributionDomainName = this.getFullDeployment(siteBucket, config.webAppUrl)
    } else {
      distributionDomainName = this.getMinimalDeployment(siteBucket)
    }
    this.addOutput('distributionDomainName', distributionDomainName)
  }

  private getMinimalDeployment (siteBucket: AutoDeleteBucket): string {
    const distribution = this.getCloudFrontDistribution(siteBucket)
    
    this.createBucketDeployment(siteBucket, distribution)

    return distribution.distributionDomainName
  }

  private getFullDeployment (siteBucket: AutoDeleteBucket, webAppUrl: string): string {
    const certificate = new CustomCertificate(this, {
      domain: webAppUrl
    })

    const distribution = this.getCloudFrontDistribution(siteBucket, {
      certificateArn: certificate.certificateArn,
      webAppUrl
    })

    this.createBucketDeployment(siteBucket, distribution)

    new CustomDomain(this, {
      source: webAppUrl,
      target: distribution.distributionDomainName
    })

    return distribution.distributionDomainName
  }

  createBucketDeployment(siteBucket: AutoDeleteBucket, distribution: CloudFrontWebDistribution) {
    new BucketDeployment(this, 'Deployment', {
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
      sources: [
        S3DeploymentSource.asset(path.join(__dirname, '..', '..', 'web-app'))
      ]
    })
  }

  private getCloudFrontDistribution(siteBucket: any, certificateConfig?: CertificateConfigProps) {
    const aliasConfiguration = certificateConfig ? {
      acmCertRef: certificateConfig.certificateArn,
      names: [certificateConfig.webAppUrl],
      securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016,
      sslMethod: SSLMethod.SNI
    } : undefined

    return new CloudFrontWebDistribution(
      this,
      'Distribution',
      {
        aliasConfiguration,
        originConfigs: [
          {
            behaviors: [{ isDefaultBehavior: true }],
            customOriginSource: {
              domainName: siteBucket.bucketWebsiteDomainName,
              originProtocolPolicy:
              OriginProtocolPolicy.HTTP_ONLY
            }
          }
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/error.html'
          }
        ]
      }
    )
  }
}
