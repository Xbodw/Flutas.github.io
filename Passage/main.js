
// 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

// 加载 Markdown 文件
try {
    fetch(`passages/${articleId}/${articleId}.md`)
        .then(response => response.text())
        .then(markdown => {
            // 将 Markdown 转换为 HTML
            const html = marked.parse(markdown);

            // 将 HTML 显示在页面上
            const articleContent = document.querySelector('.article-content');
            articleContent.innerHTML = `<br><br><br>` + html;

            // 生成目录项
            const headings = articleContent.querySelectorAll('h2, h3, h4, h5, h6');
            const toc = document.querySelector('.toc');
            headings.forEach((heading, index) => {
                const anchor = `#${heading.getAttribute('id')}`;
                const text = heading.textContent;
                for (let i = 1; i < level; i++) {
                  text = " " + text;
                }
                const level = parseInt(heading.tagName.substring(1));
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = anchor;
                a.textContent = text;
                a.classList.add(`level-${level}`);
                li.appendChild(a);
                toc.appendChild(li);

                // 监听目录项点击事件
                a.addEventListener('click', event => {
                    event.preventDefault();
                    const target = document.querySelector(`${anchor}`);
                    target.scrollIntoView({ behavior: 'smooth' });
                });
            });
            hljs.highlightAll();
            hljs.initLineNumbersOnLoad({
                // singleLine:true,
                // startFrom: 5,
            });
            at.AddCodeCopy();
            linka();
            var paralought = window.decodeURIComponent(window.location.href.split("#")[1]);
            if(paralought != 'undefined') {
                const target = document.querySelector(('#' + `${paralought}`).toLocaleLowerCase());
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    fetch(`passages/${articleId}/index.json`)
        .then(response => response.text()).then(json => {
            var config = JSON.parse(json);
            document.title = config.title;
        });
    
} catch (e) {
    Swal.fire({
        title: "文章加载失败",
        text: "你似乎来到了一片虚无",
        icon: "error",
        showCloseButton: true,
        showCancelButton: false,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "确定"
    });
}
linka();

