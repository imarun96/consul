import RepositoryService from 'consul-ui/services/repository';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';

const modelName = 'topology';
const ERROR_MESH_DISABLED = 'Connect must be enabled in order to use this endpoint';

export default RepositoryService.extend({
  dcs: service('repository/dc'),
  getModelName: function() {
    return modelName;
  },
  findBySlug: function(slug, kind, dc, nspace, configuration = {}) {
    const datacenter = this.dcs.peekOne(dc);
    if (datacenter !== null && !get(datacenter, 'MeshEnabled')) {
      return Promise.resolve();
    }
    const query = {
      dc: dc,
      ns: nspace,
      id: slug,
      kind: kind,
    };
    if (typeof configuration.cursor !== 'undefined') {
      query.index = configuration.cursor;
      query.uri = configuration.uri;
    }
    return this.store.queryRecord(this.getModelName(), query).catch(e => {
      const code = get(e, 'errors.firstObject.status');
      const body = get(e, 'errors.firstObject.detail').trim();
      switch (code) {
        case '500':
          if (datacenter !== null && body.endsWith(ERROR_MESH_DISABLED)) {
            set(datacenter, 'MeshEnabled', false);
          }
          return;
        default:
          throw e;
      }
    });
  },
});
