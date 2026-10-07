(function () {
  const Core = window.LostFoundCore;
  const STORE = 'lost-found-web-v1';
  const seed = [
    {id:'s1',type:'lost',title:'深蓝色校园卡',category:'证件卡类',location:'图书馆二楼自习区',date:'2026-10-05',contact:'wxid_lost_01',description:'卡套为透明色，内有一张校园卡，背面贴有小熊贴纸。',status:'active',mine:false},
    {id:'s2',type:'found',title:'黑色蓝牙耳机盒',category:'数码设备',location:'教学楼A区 203',date:'2026-10-04',contact:'wxid_found_02',description:'充电盒无明显品牌标识，拾到时在第三排座位下方。',status:'active',mine:false},
    {id:'s3',type:'found',title:'一串银色钥匙',category:'钥匙饰品',location:'食堂北门入口',date:'2026-10-03',contact:'wxid_found_03',description:'共三把钥匙，带蓝色圆形挂件。请说明钥匙特征后联系。',status:'active',mine:false},
    {id:'s4',type:'lost',title:'高等数学笔记本',category:'书籍资料',location:'田径场看台',date:'2026-10-01',contact:'wxid_lost_04',description:'A4活页本，封面写有“高数复习”。',status:'resolved',mine:false}
  ];
  const $ = id => document.getElementById(id);
  const read = () => { try { return JSON.parse(localStorage.getItem(STORE)) || seed; } catch (_) { return seed; } };
  const save = items => localStorage.setItem(STORE, JSON.stringify(items));
  let items = read(); let toastTimer;
  function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function showToast(message) { const node = $('toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2400); }
  function filters() { return {keyword:$('keyword').value,type:$('type-filter').value,category:$('category-filter').value,status:$('status-filter').value}; }
  function typeLabel(type) { return type === 'lost' ? '寻物启事' : '招领信息'; }
  function statusLabel(status) { return status === 'resolved' ? '已解决' : '待处理'; }
  function render() {
    const shown = Core.filterListings(items, filters());
    $('hero-count').textContent = items.filter(x => x.status === 'active').length;
    $('result-summary').textContent = `共找到 ${shown.length} 条信息`;
    $('listing-grid').innerHTML = shown.map(item => `<article class="card"><div class="card-top"><span class="badge ${item.type}">${typeLabel(item.type)}</span><span class="status ${item.status}">${statusLabel(item.status)}</span></div><h3>${escapeHTML(item.title)}</h3><p>⌖ ${escapeHTML(item.location)}　·　${escapeHTML(item.date)}</p><p class="card-desc">${escapeHTML(item.description)}</p><button type="button" data-detail="${item.id}">查看详情</button></article>`).join('');
    $('empty-state').hidden = shown.length !== 0;
    renderMine();
  }
  function renderMine() {
    const mine = items.filter(x => x.mine);
    $('my-listings').innerHTML = mine.length ? mine.map(item => `<article class="my-item"><div><h3>${escapeHTML(item.title)} <span class="status ${item.status}">${statusLabel(item.status)}</span></h3><p>${typeLabel(item.type)} · ${escapeHTML(item.location)} · ${escapeHTML(item.date)}</p></div><button type="button" data-resolve="${item.id}" ${item.status === 'resolved' ? 'disabled' : ''}>${item.status === 'resolved' ? '已解决' : '标记为已解决'}</button></article>`).join('') : '<div class="empty-state"><h3>你还没有发布信息</h3><p>填写上方表单后，信息会出现在这里。</p></div>';
  }
  function showDetail(id) {
    const item = items.find(x => x.id === id); if (!item) return;
    $('detail-content').innerHTML = `<p class="detail-type">${typeLabel(item.type)} · ${statusLabel(item.status)}</p><h2 class="detail-title">${escapeHTML(item.title)}</h2><p>${escapeHTML(item.description)}</p><dl class="detail-table"><dt>物品类别</dt><dd>${escapeHTML(item.category)}</dd><dt>地点</dt><dd>${escapeHTML(item.location)}</dd><dt>发生时间</dt><dd>${escapeHTML(item.date)}</dd></dl>${item.status === 'resolved' ? '<p class="notice">该信息已解决，无需再联系发布者。</p>' : `<div class="detail-contact"><span>联系方式：<strong>${escapeHTML(item.contact)}</strong></span><button type="button" data-copy="${escapeHTML(item.contact)}">复制联系方式</button></div>`}`;
    $('detail-dialog').showModal();
  }
  async function copyContact(text) { try { await navigator.clipboard.writeText(text); showToast('联系方式已复制'); } catch (_) { showToast(`请手动复制：${text}`); } }
  function resolve(id) { const index = items.findIndex(x => x.id === id); const result = Core.transitionStatus(items[index], 'resolved'); if (!result.ok) return showToast(result.message); items[index] = result.item; save(items); render(); showToast('状态已更新为“已解决”'); }
  document.addEventListener('click', event => { const target = event.target; if (target.dataset.detail) showDetail(target.dataset.detail); if (target.dataset.resolve) resolve(target.dataset.resolve); if (target.dataset.copy) copyContact(target.dataset.copy); });
  ['keyword','type-filter','category-filter','status-filter'].forEach(id => $(id).addEventListener(id === 'keyword' ? 'input' : 'change', render));
  $('reset-data').addEventListener('click', () => { items = seed.map(x => Object.assign({},x)); save(items); render(); showToast('已恢复示例数据'); });
  $('detail-dialog').querySelector('.dialog-close').addEventListener('click', () => $('detail-dialog').close());
  $('publish-form').addEventListener('submit', event => { event.preventDefault(); const form = new FormData(event.currentTarget); const input = Object.fromEntries(form.entries()); const check = Core.validateListing(input); $('form-message').textContent = check.message; if (!check.valid) return; const item = Object.assign({}, input, {id:'u'+Date.now(), status:'active', mine:true}); items.unshift(item); save(items); event.currentTarget.reset(); $('form-message').textContent = ''; render(); location.hash = 'mine'; showToast('发布成功：可在“我的发布”更新状态'); });
  render();
})();
