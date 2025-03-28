/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  assertEmptyResource,
  assertServiceResource,
} from '@opentelemetry/contrib-test-utils';
import { detectResources } from '@opentelemetry/resources';
import { CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK } from '@opentelemetry/semantic-conventions';
import { awsBeanstalkDetector } from '../../src';
import { AwsBeanstalkDetector } from '../../src/detectors/AwsBeanstalkDetector';

describe('BeanstalkResourceDetector', () => {
  const err = new Error('failed to read config file');
  const data = {
    version_label: 'app-5a56-170119_190650-stage-170119_190650',
    deployment_id: '32',
    environment_name: 'scorekeep',
  };
  const noisyData = {
    noise: 'noise',
    version_label: 'app-5a56-170119_190650-stage-170119_190650',
    deployment_id: '32',
    environment_name: 'scorekeep',
  };

  let readStub, fileStub;

  afterEach(() => {
    sinon.restore();
  });

  it('should successfully return resource data', async () => {
    fileStub = sinon
      .stub(AwsBeanstalkDetector, 'fileAccessAsync' as any)
      .resolves();
    readStub = sinon
      .stub(AwsBeanstalkDetector, 'readFileAsync' as any)
      .resolves(JSON.stringify(data));
    sinon.stub(JSON, 'parse').returns(data);

    const resource = detectResources({ detectors: [awsBeanstalkDetector] });
    await resource.waitForAsyncAttributes?.();

    sinon.assert.calledOnce(fileStub);
    sinon.assert.calledOnce(readStub);
    assert.ok(resource);
    assertServiceResource(resource, {
      name: CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK,
      namespace: 'scorekeep',
      version: 'app-5a56-170119_190650-stage-170119_190650',
      instanceId: '32',
    });
  });

  it('should successfully return resource data with noise', async () => {
    fileStub = sinon
      .stub(AwsBeanstalkDetector, 'fileAccessAsync' as any)
      .resolves();
    readStub = sinon
      .stub(AwsBeanstalkDetector, 'readFileAsync' as any)
      .resolves(JSON.stringify(noisyData));
    sinon.stub(JSON, 'parse').returns(noisyData);

    const resource = detectResources({ detectors: [awsBeanstalkDetector] });
    await resource.waitForAsyncAttributes?.();

    sinon.assert.calledOnce(fileStub);
    sinon.assert.calledOnce(readStub);
    assert.ok(resource);
    assertServiceResource(resource, {
      name: CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK,
      namespace: 'scorekeep',
      version: 'app-5a56-170119_190650-stage-170119_190650',
      instanceId: '32',
    });
  });

  it('should return empty resource when failing to read file', async () => {
    fileStub = sinon
      .stub(AwsBeanstalkDetector, 'fileAccessAsync' as any)
      .resolves();
    readStub = sinon
      .stub(AwsBeanstalkDetector, 'readFileAsync' as any)
      .rejects(err);

    const resource = detectResources({ detectors: [awsBeanstalkDetector] });
    await resource.waitForAsyncAttributes?.();

    sinon.assert.calledOnce(fileStub);
    sinon.assert.calledOnce(readStub);
    assert.ok(resource);
    assertEmptyResource(resource);
  });

  it('should return empty resource when config file does not exist', async () => {
    fileStub = sinon
      .stub(AwsBeanstalkDetector, 'fileAccessAsync' as any)
      .rejects(err);
    readStub = sinon
      .stub(AwsBeanstalkDetector, 'readFileAsync' as any)
      .resolves(JSON.stringify(data));

    const resource = detectResources({ detectors: [awsBeanstalkDetector] });
    await resource.waitForAsyncAttributes?.();

    sinon.assert.calledOnce(fileStub);
    sinon.assert.notCalled(readStub);
    assert.ok(resource);
    assertEmptyResource(resource);
  });
});
