import * as cdk from '@aws-cdk/core';
import { Function, AssetCode, Runtime } from '@aws-cdk/aws-lambda';
import { Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';
import { Rule, Schedule } from '@aws-cdk/aws-events'
import { LambdaFunction } from '@aws-cdk/aws-events-targets';

export class CostnotifyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    // IAM Role for Lambda
    const executionLambdaRole = new Role(this, 'secureLambdaRole', {
      roleName: 'awscostnotifylambdarole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // defines an AWS Lambda.resource
    const awscostnotify = new Function(this, 'awscostnotify', {
      functionName: 'awscostnotify',
      runtime: Runtime.NODEJS_12_X,
      code: AssetCode.fromAsset('lambda'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      environment: {
        TZ: "Asia/Tokyo",
        SLACK_CHANNEL: ''
      }
    });

    //
    const rule = new Rule(this, 'Rule', {
      schedule: Schedule.expression('cron(0 0 ? * * *)')
    });

    rule.addTarget(new LambdaFunction(awscostnotify));
  }
}
