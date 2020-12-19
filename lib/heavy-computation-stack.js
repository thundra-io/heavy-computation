const path = require("path");

const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const lambdaEventSources = require("@aws-cdk/aws-lambda-event-sources");
const iam = require("@aws-cdk/aws-iam");

const SOURCE_EMAIL = require("./email.json");

class HeavyComputationStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const tasksBucket = this.createS3Bucket("tasks");
    const resultsBucket = this.createS3Bucket("results");

    const backendFunction = this.createLambdaFunction("backend", {
      TASKS_BUCKET_NAME: tasksBucket.bucketName,
    });
    const calculatorFunction = this.createLambdaFunction("calculator", {
      TASKS_BUCKET_NAME: tasksBucket.bucketName,
      RESULTS_BUCKET_NAME: resultsBucket.bucketName,
    });

    const sendEmailRole = this.createSendEmailRole();
    const emailFunction = this.createLambdaFunction(
      "email",
      { RESULTS_BUCKET_NAME: resultsBucket.bucketName, SOURCE_EMAIL },
      sendEmailRole
    );

    tasksBucket.grantWrite(backendFunction);
    tasksBucket.grantRead(calculatorFunction);
    this.addS3CreateObjectEventSource(calculatorFunction, tasksBucket);

    resultsBucket.grantWrite(calculatorFunction);
    resultsBucket.grantRead(emailFunction);
    this.addS3CreateObjectEventSource(emailFunction, resultsBucket);

    new apigateway.LambdaRestApi(this, "api", { handler: backendFunction });
  }

  createLambdaFunction(name, environment, role = null) {
    return new lambda.Function(this, name, {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "functions", name)),
      environment,
      role,
    });
  }

  createS3Bucket(name) {
    return new s3.Bucket(this, name);
  }

  addS3CreateObjectEventSource(lambda, bucket) {
    return lambda.addEventSource(
      new lambdaEventSources.S3EventSource(bucket, {
        events: [s3.EventType.OBJECT_CREATED],
      })
    );
  }

  createSendEmailRole() {
    const role = new iam.Role(this, "mailsender", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // required when using a custom role
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );

    return role;
  }
}

module.exports = { HeavyComputationStack };
