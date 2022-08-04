import { Readable, PassThrough } from 'stream';
import DatasetTransformer from './dataset-transformer';
import readline from 'readline';
import { EXAMPLE, RDF_NAMESPACE } from '../../lib/utils/namespaces';
import Member from '../../lib/models/member';
import { DefaultDatasetConfiguration } from './default-transformer';
import dataFactory from '@rdfjs/data-model';

export class IPFSIndexTransformer implements DatasetTransformer {
  transform(input: Readable, config: DefaultDatasetConfiguration): Readable {
    const readLineInterface = readline.createInterface({
      input: input,
    });

    const resultStream = new PassThrough({ objectMode: true });

    readLineInterface
      .on('line', async (input) => {
        readLineInterface.pause();
        const list = JSON.parse(input);
        const id = dataFactory.namedNode(
          encodeURI(config.resourceIdPrefix + list[0])
        );
        let resource = new Member(id);
        resource.addProperty(
          RDF_NAMESPACE('type').value,
          dataFactory.namedNode(config.resourceType)
        );
        resource.addProperty(config.propertyType, dataFactory.literal(list[1]));
        resultStream.push(resource);
        readLineInterface.resume();
      })
      .on('close', () => {
        resultStream.end();
      });
    resultStream.on('pause', () => {
      readLineInterface.pause();
    });
    resultStream.on('resume', () => {
      readLineInterface.resume();
    });
    return resultStream;
  }
}