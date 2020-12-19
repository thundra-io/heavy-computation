// Reads two numbers from an S3 bucket and
// sends them to an email address related to them

const aws = require("aws-sdk");
const s3 = new aws.S3();

const { RESULTS_BUCKET_NAME, AWS_REGION, SOURCE_EMAIL } = process.env;

const ses = new aws.SES({ region: AWS_REGION });

exports.handler = async ({ Records }) => {
  await Promise.all(Records.map(handleRecord));
};

async function handleRecord(record) {
  const Key = record.s3.object.key;

  const resultLocator = { Bucket: RESULTS_BUCKET_NAME, Key };
  const object = await s3.getObject(resultLocator).promise();
  const { email, result, number } = JSON.parse(object.Body);

  await sendEmail(
    email,
    "Your Computation Result is Ready",
    `${number}! equals ${result}`
  );
}

function sendEmail(destination, subject, body) {
  const emailDefinition = {
    Source: SOURCE_EMAIL,
    Destination: { ToAdresses: [destination] }, // Bug: ToAdresses needs to be ToAddresses
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: body } },
    },
  };

  return new Promise((resolve, reject) =>
    ses.sendEmail(emailDefinition, (error, data) =>
      error ? reject(error) : resolve(data)
    )
  );
}
