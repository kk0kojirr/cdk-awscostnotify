import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Costnotify from '../lib/costnotify-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Costnotify.CostnotifyStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
