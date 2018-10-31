'use strict';
//loading environment variables
require('dotenv').config()
const config = require('./src/config');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    region: config.AWS_REGION
});
const fs = require('fs');

function loadMapperFile() {
    return new Promise((resolve, reject) => {
        try{
            let params = { Bucket: config.MAPPER_BUCKET_NAME, Key: config.MAPPER_OBJECT_KEY };
            let filePath = './mapper.js';
            s3.getObject(params, (error, data) => {
                if (error){
                    reject(error);
                }else{
                    fs.writeFileSync(filePath, data.Body.toString());
                    resolve();
                }
            });
        }catch(error){
            reject(error);
        }
    });
}

(async () => {
    try {
        console.log('loading mapper file...')
        await loadMapperFile();
        console.log('mapper file loaded')
        const MigrationJob = require('./index');
        const mapperFunction = require('./mapper');

        const migrationJob = new MigrationJob(config.DYNAMODB_TABLE_NAME, config.MONGODB_COLLECTION_NAME, config.MONGODB_DATABASE_NAME, 100);
        
        migrationJob.setMapper(mapperFunction);
        console.log('running migration...')
        await migrationJob.run();
        console.log('migration completed')
        process.exit(0);
    } catch (error) {
        console.error('migration error',error);
        process.exit(1);
    }
})();


