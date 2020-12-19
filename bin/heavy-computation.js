#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const { HeavyComputationStack } = require('../lib/heavy-computation-stack');

const app = new cdk.App();
new HeavyComputationStack(app, 'HeavyComputationStack');
