# Mira S3 Webhosting Sample Application

This application is a very basic application, that provides ready to use project setup for [Mira accelerator].

The successful deployment of this project will create an S3 bucket with web hosting enabled and a single index.html file in it.

## Getting Started

1. Install dependencies with `npm install`
2. Run `npx mira docs` and navigate to [http://localhost:3000/#/quick-start/](http://localhost:3000/#/quick-start/) for further instructions

__Note:__ The default port may be already taken, if above website is not available please check your terminal logs for the correct address.

__Note:__ By default, repository mirroring is disabled. Go to `.github/workflows/mirror.yml` and follow the comment there.

## Project specific files
* `infra/src/index.ts` - your stack definition.
* `infra/src/permissions.ts` - your stack with IAM permissions needed to deploy the app with CI.
* `infra/src/buildspec.yaml` - [Build specification reference for CodeBuild].
* `config/default.sample.json` - example configuration file (rename to default.json to use)
* `config/dev.json` - local development configuration file that overrides default.json.

<!-- Links -->
[Mira accelerator]: https://github.com/nearform/mira
[Build specification reference for CodeBuild]: https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html
