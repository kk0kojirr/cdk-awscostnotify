#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CostnotifyStack } from '../lib/costnotify-stack';

const app = new cdk.App();
new CostnotifyStack(app, 'CostnotifyStack');
