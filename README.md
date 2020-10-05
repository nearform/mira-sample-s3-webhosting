# Mira S3 Webhosting Sample Application

This application is a very basic application, that provides a ready-to-use project setup for the [Mira accelerator].

The successful deployment of this project will create an S3 bucket with web hosting enabled and a single index.html file in it, which will output a 'hello world' message.

This sample app is recommended primarily for evaluation purposes, and project owners who want the benefits of Mira CI orchestration but wish to make a clean start with their project.

## Getting Started

1. Generate your own project repository from this repo [mira-sample-s3-webhosting](https://github.com/nearform/mira-sample-s3-webhosting/generate)

    ⚠️ Remember to make your new repository __🕵🏻‍♀️ Private__ as you store potentially sensitive information in the Mira configuration files.

2. Clone your newly created repository

3. Ensure that you are using Node.js v12:

   ```bash
   % node --version
   v12.16.3
   ```

   or, if using [nvm]:

   ```bash
   % nvm use
   Now using node v12.16.3 (npm v6.14.4)
   ```

4. Install the required dependencies

    Make sure you use the supported version of the CDK (__1.61.1__) and all the required dependencies are included in your package.json file.
    See the [Mira documentation](#mira-docs) for the full list.

    __Note:__  It is a known constraint of CDK that the usage of its version number must be exact. Range operators for the version will cause your sample to break, e.g. `^1.61.1` is not the same as `1.61.1`.

5. Build

   ```bash
   npm run build
   ```

6. Set up your config file

   ```bash
   cp config/default.sample.json config/default.json
   ```

7. Adjust `config/default.json` with your settings

    1. Update the app and dev sections with your desired values e.g.:
        ```bash
        "app": {
           "prefix": "big-company",
           "name": "super-app"
         },
        "dev": {
            "target": "default"
        }
       ```
    2. Update the `accounts` section to at least include settings for your `default` (name specified as a target in `dev` section) deployment e.g.:
        ```bash
        "accounts": {
          "default": {
            "env": {
              "account": "11111111111",
              "region": "eu-west-1"
            },
            "profile": "mira-dev"
          }
       }
       ```

8. If you are working as part of a team, create a `config/dev.json` file and provide your own app settings e.g.:
    ```bash
    "app": {
       "prefix": "john",
       "name": "super-app"
     }
   ```
   __Note:__ `config/dev.json` file is specific to your personal setup and should not be tracked in GIT.

9. Bootstrap AWS CDK on the target AWS account and region, i.e.:
    ```bash
   cdk bootstrap aws://YOUR_NUMBER/YOUR_REGION --profile YOUR_PROFILE
   ```
   __Note:__ If CDK is already bootstrapped, you can skip this step.

10. Deploy

     ```bash
     npm run deploy
     ```
     __Note:__ The default tags will be associated to that stack: StackName,  CreatedBy (Owner) and CostCenter (If defined).

     At this step you should have your development environment deployed and ready to use.

11. (Optional) Setup CI

    See the quickstart section of the [Mira documentation](#mira-docs) for details.

    __Note:__ If also setting up CI, then be aware that, by default, repository mirroring is disabled. Go to `.github/workflows/mirror.yml` and follow the comment there.

## Mira Docs
Run `npx mira docs` and navigate to http://localhost:3000/ for more information about Mira.

__Note:__ The default port may be already taken; if the above website is not available then please check your terminal logs for the correct address.

## Project specific files
* `infra/src/index.ts` - your stack definition.
* `infra/src/permissions.ts` - your stack with IAM permissions needed to deploy the app with CI.
* `infra/src/buildspec.yaml` - [Build specification reference for CodeBuild].
* `config/default.sample.json` - example configuration file (rename to default.json to use)
* `config/dev.json` - local development configuration file that overrides default.json.

<!-- Links -->
[Mira accelerator]: https://github.com/nearform/mira
[Build specification reference for CodeBuild]: https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html
