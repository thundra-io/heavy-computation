// Reads a number from one S3 bucket, calculates the factorial
// and saves it back to another S3 bucket

const aws = require("aws-sdk");
const s3 = new aws.S3();

const { TASKS_BUCKET_NAME, RESULTS_BUCKET_NAME } = process.env;

exports.handler = async ({ Records }) => {
  await Promise.all(Records.map(handleRecord));
};

async function handleRecord(record) {
  const Key = record.s3.object.key;

  const taskLocator = { Bucket: TASKS_BUCKET_NAME, Key };
  const object = await s3.getObject(taskLocator).promise();
  const { email, number } = JSON.parse(object.Body);

  const result = factorial(number);

  const Body = JSON.stringify({ result, email, number });
  const resultLocator = { Bucket: RESULTS_BUCKET_NAME, Key, Body };
  await s3.putObject(resultLocator).promise();
}

const f = [];
function factorial(n) {
  if (n == 0 || n == 1) return 1;
  if (f[n] > 0) return f[n];
  return (f[n] = factorial(n - 1) * n);
}
