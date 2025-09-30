export default ({ env }) => {
  const host = env('MEILISEARCH_HOST');
  const apiKey = env('MEILISEARCH_MASTER_KEY');

  return {
    ...(host && apiKey
      ? {
          meilisearch: {
            config: {
              host,
              apiKey,
            },
          },
        }
      : {}),
  };
};
