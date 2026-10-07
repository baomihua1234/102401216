/* 可独立测试的业务逻辑：不依赖页面或浏览器存储。 */
(function (root) {
  function normalized(value) { return String(value || '').trim().toLowerCase(); }
  function validateListing(input) {
    const required = ['type', 'title', 'category', 'location', 'date', 'contact', 'description'];
    const labels = {type:'信息类型',title:'物品名称',category:'物品类别',location:'地点',date:'发生时间',contact:'联系方式',description:'物品描述'};
    for (const key of required) if (!normalized(input[key])) return {valid:false, message:`请填写${labels[key]}`};
    if (!['lost', 'found'].includes(input.type)) return {valid:false, message:'信息类型不正确'};
    if (normalized(input.title).length > 30) return {valid:false, message:'物品名称不能超过30个字符'};
    if (normalized(input.description).length > 200) return {valid:false, message:'物品描述不能超过200个字符'};
    return {valid:true, message:''};
  }
  function filterListings(listings, filters) {
    const query = normalized(filters.keyword);
    return listings.filter(item => {
      const haystack = [item.title,item.location,item.description,item.category].map(normalized).join(' ');
      return (!query || haystack.includes(query)) && (!filters.type || item.type === filters.type) && (!filters.category || item.category === filters.category) && (!filters.status || item.status === filters.status);
    });
  }
  function transitionStatus(item, nextStatus) {
    if (!item || item.status !== 'active') return {ok:false, message:'该信息已是已解决状态'};
    if (nextStatus !== 'resolved') return {ok:false, message:'不支持的状态变更'};
    return {ok:true, item:Object.assign({}, item, {status:'resolved', resolvedAt:new Date().toISOString().slice(0,10)})};
  }
  root.LostFoundCore = {normalized, validateListing, filterListings, transitionStatus};
})(typeof window !== 'undefined' ? window : globalThis);
