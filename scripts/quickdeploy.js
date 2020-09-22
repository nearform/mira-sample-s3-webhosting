const AWS = require('aws-sdk');
const assert = require('assert');
const fs = require('fs');
const config = require('config');
let files = fs.readdirSync('cdk.out');
const {assumeRole} = require('mira/dist/src/assume-role');
const glob = require('glob');
const {MiraApp} = require('mira/dist/src/cdk/app');
const {MiraBootstrap} = require('mira/dist/src/cdk/bootstrap');
const {getServiceStackName} = MiraBootstrap;
const {getBaseStackNameFromParams} = MiraApp;
const {MiraConfig} = require('mira/dist/src/config/mira-config');
let miraS3;

/**
 * Gets the files within an asset folder.
 */
const getAssetFiles = async (id) => {
    assert(fs.existsSync(getAssetPrefix(id)) &&
        fs.statSync(getAssetPrefix(id)).isDirectory(), 'A provided asset ID'
        + ' either did not exist or was not a directory.  Was this intended?');
    return new Promise((resolve) => {
        glob(`${getAssetPrefix(id)}/**/*`, {}, (err, matches) => {
            resolve(matches.map((match) => match.substr(getAssetPrefix(id).length)));
        });
    });
}

/**
 * Gets the asset prefix given some ID.
 */
const getAssetPrefix = (id) => `cdk.out/asset.${id}`;

/**
 * Gets the objects from a bucket.
 */
const getBucketObjects = async (Bucket) => {
    const s3 = await getS3();
    return s3.listObjects({Bucket}).promise();
}

/**
 * Gets references for bucket.
 */
const getBucketRefs = async () => {
    const files = getTemplateFiles();
    const bucketsBySite = await getSiteBuckets();
    for (let file in files) {
        const template = files[file];
        if (!template.Resources) {
            continue;
        }
        for (let name in template.Resources) {
            const {Type, Properties} = template.Resources[name];
            if (!Type) {
                continue;
            }
            if (Type !== 'Custom::CDKBucketDeployment') {
                continue;
            }
            if (!bucketsBySite[Properties.DestinationBucketName.Ref]) {
                // TODO: Throw an error or provide warning?
                console.warn('Something unexpected happened.  Found a '
                    + 'Custom::CDKBucketDeployment with a DestinationBucketName'
                    + ' that is unknown.', Properties.DestinationBucketName.Ref)
                continue;
            }
            bucketsBySite[Properties.DestinationBucketName.Ref].assets =
                Properties.SourceBucketNames.map(({Ref}) => {
                    return Ref.split(/AssetParameters/g)[1].split(/S3Bucket/g)[0];
                });
        }
    }
    return bucketsBySite;
}

/**
 * Given some template JSON, grabs all resource objects that are of type
 * AWS::S3::Bucket.
 */
const getBucketResources = () => {
    const files = getTemplateFiles();
    const bucketsByFile = {};
    for (let file in files) {
        const template = files[file];
        if (!template.Resources) {
            continue;
        }
        for (let name in template.Resources) {
            const {Type, Properties} = template.Resources[name];
            if (!Type) {
                continue;
            }
            if (Type !== 'AWS::S3::Bucket') {
                continue;
            }
            if (!bucketsByFile[file]) {
                bucketsByFile[file] = {};
            }
            bucketsByFile[file][name] = template.Resources[name];
        }
    }
    return bucketsByFile;
}

/**
 * Gets the environment for Mira.
 */
const getEnvironment = () => {
    const env = MiraConfig.getEnvironment();
    return env;
}

/**
 * Given a provided profile, reads the users local ~/.aws/config file and 
 * @param {*} profile 
 */
const getRoleArn = (profile) => {
    const cwd = process.cwd();
    process.chdir(process.env.HOME);
    if (!fs.existsSync('.aws/config')) {
        // TODO: Throw an error?
        process.chdir(cwd);
        return false;
    }
    const lines = fs.readFileSync('.aws/config', 'utf8').split(/\n/g);
    process.chdir(cwd);
    const idx = lines.findIndex((line) => {
        return !!(new RegExp(`\\[profile ${profile}`, '', line))
    });
    if (idx === -1) {
        // TODO: Throw an error?
        return false;
    }
    const roleLine = lines.slice(idx).find((line) => !!line.match(/^\s*role_arn\s*=/));
    if (!roleLine) {
        // TODO: Throw an error if roleLine is null?
        return false;
    }
    return roleLine.split(/=/).slice(1).join('=').trim();
}

/**
 * Gets the S3 object.
 */
const getS3 = async () => {
    if (!!miraS3) {
        return miraS3;
    }
    const awsConfig = await assumeRole(getRoleArn(config.accounts[getEnvironment().name].profile));
    AWS.config = awsConfig;
    miraS3 = new AWS.S3({apiVersion: '2006-03-01'});
    return miraS3;
}

/**
 * Gets S3 buckets beginning with a prefix.
 */
const getS3Buckets = async (prefix, siteName) => {
    const s3 = await getS3();
    const response = await s3.listBuckets().promise();
    prefix = prefix.toLowerCase().slice(0, 30);
    siteName = siteName.toLowerCase();
    const bucketPrefix = `${prefix}-${siteName}`;
    const targetBuckets = response.Buckets.filter(({Name}) => {
        return Name.startsWith(bucketPrefix);
    });
    return targetBuckets;
}

/**
 * For a given template file, gets all site buckets.
 */
const getSiteBuckets = async () => {
    const files = getTemplateFiles();
    const siteBuckets = {};
    const bucketsByFile = getBucketResources();
    for (let file in files) {
        if (!bucketsByFile[file]) {
            continue;
        }
        for (let name in bucketsByFile[file]) {
            const {Properties} = bucketsByFile[file][name];
            const {Value: stackName} = Properties.Tags.find(({Key}) => Key === 'StackName');
            const s3Buckets = await getS3Buckets(stackName, name);
            siteBuckets[name] = {
                s3: s3Buckets.map(({Name}) => Name)
            };
        }
    }
    return siteBuckets;
}

/**
 * Gets the stack name.
 */
const getStackName = () => {
    const stackName = getBaseStackNameFromParams(config.app.prefix, 
        config.app.name, 'Service');
    return stackName;
}

/**
 * Gets the template files for the given CWD.
 */
const getTemplateFiles = () => {
    const templateFiles = {}
    files = files.filter((file) => file.endsWith('.template.json'));
    for (let file of files) {
        templateFiles[file] = JSON.parse(fs.readFileSync(`cdk.out/${file}`, 'utf8'));
    }
    return templateFiles;
}

/**
 * Quickly deploys an asset bundle generated by CDK to an intended S3 bucket
 * as defined by a CDK generated Cfn template.
 */
const quickDeploy = async () => {
    const sites = await getBucketRefs();
    const s3 = await getS3();
    for (let site in sites) {
        const {s3: buckets, assets} = sites[site];
        for (let Bucket of buckets) {
            for (let id of assets) {
                const files = await getAssetFiles(id);
                for (let file of files) {
                    const result = await s3.putObject({
                        Body: fs.readFileSync(`${getAssetPrefix(id)}/${file}`, 'utf8'),
                        Bucket,
                        Key: file
                    }).promise();
                    console.info(`Put object: ${result}`);
                }
            }
        }
    }
}

quickDeploy();