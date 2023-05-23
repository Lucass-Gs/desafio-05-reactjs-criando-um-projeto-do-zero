import * as prismic from '@prismicio/client';
import * as prismicNext from '@prismicio/next';
import { NextApiRequest } from 'next';
import config from './slicemachine.config.json';

/**
 * The project's Prismic repository name.
 */
export const { repositoryName } = config;

/**
 * A list of Route Resolver objects that define how a document's `url` field
 * is resolved.
 *
 * {@link https://prismic.io/docs/route-resolver#route-resolver}
 */
// TODO: Update the routes array to match your project's route structure.
const routes: prismic.ClientConfig['routes'] = [
  {
    type: 'post',
    path: '/',
  },
];

interface CreateClientOptions extends prismicNext.CreateClientConfig {
  req?: NextApiRequest;
}

/**
 * Creates a Prismic client for the project's repository. The client is used to
 * query content from the Prismic API.
 *
 * @param config - Configuration for the Prismic client.
 */
export const createClient = (
  clientOptions: CreateClientOptions = {}
): prismic.Client => {
  const client = prismic.createClient(repositoryName, {
    routes,
    ...clientOptions,
  });

  prismicNext.enableAutoPreviews({
    client,
    previewData: clientOptions.previewData,
    req: clientOptions.req,
  });

  return client;
};
