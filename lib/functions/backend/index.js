// Takes an email and number via HTTP and
// writes them as JSON into an S3 bucket

const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { TASKS_BUCKET_NAME } = process.env;

exports.handler = async ({ body }) => {
  const { email, number } = JSON.parse(body);

  await s3
    .putObject({
      Bucket: TASKS_BUCKET_NAME,
      Key: Math.random() + Date.now(), // Bug: Key has to be of type string
      Body: JSON.stringify({ email, number }),
    })
    .promise();

  return { statusCode: 200, body: "OK" };
};
