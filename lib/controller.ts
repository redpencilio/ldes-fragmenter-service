import type { Request, Response, NextFunction } from 'express';
import {
  getNode as getNodeFn,
  addData as addDataFn,
  getConfigFromEnv,
  ACCEPTED_CONTENT_TYPES,
} from '@lblod/ldes-producer';

const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  throw new Error('No BASE_URL provided');
}

const config = getConfigFromEnv();
console.log('Current config:', config);
export async function getNode(req: Request, res: Response, next: NextFunction) {
  try {
    const contentType = req.accepts(ACCEPTED_CONTENT_TYPES) || '';

    const result = await getNodeFn(config, {
      folder: req.params.folder,
      contentType: contentType,
      nodeId: parseInt(req.params.nodeId ?? '1'),
      // fixme shouldn't it be req.params.subfolder? according to the readme:
      // - `GET /:folder/:subfolder?/:nodeId`: this endpoint allows you to query a specific node
      //          represented in an RDF format to your liking. Using the HTTP Accept header,
      //          you can provide which representation of the data you would like to receive.
      //          Typically, the view node of the dataset is located in `/:folder/1`
      //          while the other nodes are additionally stored in subfolders.
      subFolder: req.params[0] || '',
    });

    if (result.fromCache) {
      res.header('Cache-Control', 'public, immutable');
    }

    res.header('Content-Type', contentType);

    result.stream.pipe(res);
  } catch (e) {
    console.error(e);
    return next(e);
  }
}

export async function addData(req: Request, res: Response, next: NextFunction) {
  try {
    const contentType = req.headers['content-type'] as string;
    await addDataFn(config, {
      contentType,
      folder: req.params.folder,
      body: req.body,
      fragmenter: req.query.fragmenter as string,
    });

    res.status(201).send();
  } catch (e) {
    console.error(e);
    return next(e);
  }
}
