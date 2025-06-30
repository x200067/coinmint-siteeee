const GRAPHQL_ENDPOINT = 'https://你的域名/graphql';

// 拉文章列表
async function fetchPosts() {
  const query = `
    query {
      posts(first: 10) {
        nodes {
          title
          slug
        }
      }
    }
  `;
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const { data } = await res.json();
  return data.posts.nodes;
}

// 拉单篇文章详情
async function fetchPostBySlug(slug) {
  const query = `
    query($slug: String!) {
      postBy(slug: $slug) {
        title
        content
      }
    }
  `;
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { slug } })
  });
  const { data } = await res.json();
  return data.postBy;
}

// 渲染列表视图
async function renderPostList() {
  const listEl = document.getElementById('post-list');
  listEl.innerHTML = ''; 
  const posts = await fetchPosts();
  posts.forEach(post => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${post.slug}`;
    a.textContent = post.title;
    li.appendChild(a);
    listEl.appendChild(li);
  });
  document.getElementById('blog').scrollIntoView();
}

// 渲染详情视图
async function renderPostDetail(slug) {
  const titleEl = document.getElementById('post-title');
  const contentEl = document.getElementById('post-content');
  const post = await fetchPostBySlug(slug);
  titleEl.innerText = post.title;
  contentEl.innerHTML = post.content;
  document.getElementById('post-detail').style.display = '';
}

// 路由控制
function handleRouting() {
  const slug = location.hash.slice(1);
  const listView = document.getElementById('post-list');
  const detailView = document.getElementById('post-detail');
  if (slug) {
    listView.style.display = 'none';
    detailView.style.display = '';
    renderPostDetail(slug);
  } else {
    detailView.style.display = 'none';
    listView.style.display = '';
    renderPostList();
  }
}

// 绑定返回按钮
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('back-button')
          .addEventListener('click', () => location.hash = '');
  window.addEventListener('hashchange', handleRouting);
  handleRouting();
});
