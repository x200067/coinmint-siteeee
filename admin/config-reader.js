/**
 * 网站配置读取器
 * 用于从管理面板读取配置并应用到网站
 */

(function() {
    'use strict';
    
    // 从localStorage读取配置
    function loadSiteConfig() {
        try {
            const savedData = localStorage.getItem('websiteData');
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.warn('无法读取网站配置:', error);
        }
        return null;
    }
    
    // 应用基本信息配置
    function applyBasicConfig(config) {
        if (!config.basic) return;
        
        const { title, subtitle, keywords, description } = config.basic;
        
        // 更新页面标题
        if (title) {
            document.title = title;
            
            // 更新页面中的标题元素
            const titleElements = document.querySelectorAll('h1, .site-title, .main-title');
            titleElements.forEach(el => {
                if (el.textContent.includes('Coinmint') || el.textContent.includes('标题')) {
                    el.textContent = title;
                }
            });
        }
        
        // 更新副标题
        if (subtitle) {
            const subtitleElements = document.querySelectorAll('.subtitle, .site-subtitle, .tagline');
            subtitleElements.forEach(el => {
                el.textContent = subtitle;
            });
        }
        
        // 更新meta标签
        if (keywords) {
            let keywordsMeta = document.querySelector('meta[name="keywords"]');
            if (keywordsMeta) {
                keywordsMeta.content = keywords;
            }
        }
        
        if (description) {
            let descMeta = document.querySelector('meta[name="description"]');
            if (descMeta) {
                descMeta.content = description;
            }
        }
    }
    
    // 应用内容配置
    function applyContentConfig(config) {
        if (!config.content) return;
        
        const { bannerTitle, bannerDescription, bannerButtonText, bannerButtonLink, 
                aboutContent, contactEmail, contactPhone, services } = config.content;
        
        // 更新横幅内容
        if (bannerTitle) {
            const bannerTitles = document.querySelectorAll('.banner-title, .hero-title, .slide-text h2');
            bannerTitles.forEach(el => el.textContent = bannerTitle);
        }
        
        if (bannerDescription) {
            const bannerDescs = document.querySelectorAll('.banner-description, .hero-description, .slide-text p');
            bannerDescs.forEach(el => el.textContent = bannerDescription);
        }
        
        if (bannerButtonText) {
            const bannerButtons = document.querySelectorAll('.banner-button, .hero-button, .cta-button');
            bannerButtons.forEach(el => el.textContent = bannerButtonText);
        }
        
        if (bannerButtonLink) {
            const bannerLinks = document.querySelectorAll('.banner-button, .hero-button, .cta-button');
            bannerLinks.forEach(el => {
                if (el.tagName === 'A') {
                    el.href = bannerButtonLink;
                }
            });
        }
        
        // 更新关于我们内容
        if (aboutContent) {
            const aboutElements = document.querySelectorAll('.about-content, .company-intro, .about-text');
            aboutElements.forEach(el => {
                el.innerHTML = aboutContent.replace(/\n/g, '<br>');
            });
        }
        
        // 更新联系信息
        if (contactEmail) {
            const emailElements = document.querySelectorAll('.contact-email, [href^="mailto:"]');
            emailElements.forEach(el => {
                if (el.tagName === 'A') {
                    el.href = `mailto:${contactEmail}`;
                    el.textContent = contactEmail;
                } else {
                    el.textContent = contactEmail;
                }
            });
        }
        
        if (contactPhone) {
            const phoneElements = document.querySelectorAll('.contact-phone, [href^="tel:"]');
            phoneElements.forEach(el => {
                if (el.tagName === 'A') {
                    el.href = `tel:${contactPhone}`;
                    el.textContent = contactPhone;
                } else {
                    el.textContent = contactPhone;
                }
            });
        }
        
        // 更新服务项目
        if (services && services.length > 0) {
            updateServices(services);
        }
    }
    
    // 更新服务项目
    function updateServices(services) {
        const serviceContainer = document.querySelector('.services-container, .service-list, .features');
        if (!serviceContainer) return;
        
        // 清空现有服务
        serviceContainer.innerHTML = '';
        
        // 添加新服务
        services.forEach(service => {
            const serviceElement = document.createElement('div');
            serviceElement.className = 'service-item';
            serviceElement.innerHTML = `
                <div class="service-icon">${service.icon || '🔧'}</div>
                <h3 class="service-name">${service.name}</h3>
                <p class="service-description">${service.description}</p>
            `;
            serviceContainer.appendChild(serviceElement);
        });
    }
    
    // 应用图片配置
    function applyImageConfig(config) {
        if (!config.images || config.images.length === 0) return;
        
        // 这里可以根据需要更新网站中的图片
        // 例如更新轮播图、产品图片等
        console.log('已上传图片数量:', config.images.length);
    }
    
    // 添加管理面板入口
    function addAdminEntry() {
        // 创建一个隐藏的管理入口
        const adminEntry = document.createElement('div');
        adminEntry.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #3498db;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: all 0.3s;
            opacity: 0.7;
        `;
        adminEntry.innerHTML = '⚙️';
        adminEntry.title = '管理面板';
        
        adminEntry.addEventListener('mouseenter', () => {
            adminEntry.style.opacity = '1';
            adminEntry.style.transform = 'scale(1.1)';
        });
        
        adminEntry.addEventListener('mouseleave', () => {
            adminEntry.style.opacity = '0.7';
            adminEntry.style.transform = 'scale(1)';
        });
        
        adminEntry.addEventListener('click', () => {
            window.open('/admin/panel.html', '_blank');
        });
        
        document.body.appendChild(adminEntry);
    }
    
    // 主初始化函数
    function initConfigReader() {
        const config = loadSiteConfig();
        
        if (config) {
            console.log('正在应用网站配置...');
            applyBasicConfig(config);
            applyContentConfig(config);
            applyImageConfig(config);
            console.log('网站配置已应用');
        }
        
        // 添加管理入口（仅在开发环境或特定条件下）
        if (window.location.hostname === 'localhost' || window.location.search.includes('admin=true')) {
            addAdminEntry();
        }
    }
    
    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConfigReader);
    } else {
        initConfigReader();
    }
    
    // 监听配置更新
    window.addEventListener('storage', function(e) {
        if (e.key === 'websiteData') {
            console.log('检测到配置更新，重新应用...');
            setTimeout(initConfigReader, 100);
        }
    });
    
    // 暴露全局函数供调试使用
    window.reloadSiteConfig = initConfigReader;
    
})();
