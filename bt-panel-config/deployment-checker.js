#!/usr/bin/env node
/**
 * Coinmint 网站部署检查工具
 * 用于验证宝塔面板部署是否正确
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class DeploymentChecker {
    constructor(domain) {
        this.domain = domain;
        this.checks = [];
    }

    // 检查必需文件是否存在
    checkRequiredFiles() {
        console.log('🔍 检查必需文件...');
        
        const requiredFiles = [
            'index.html',
            'robots.txt',
            'sitemap.xml',
            'skin/css/style.css',
            'skin/js/main.js'
        ];

        let allFilesExist = true;
        
        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file} - 存在`);
            } else {
                console.log(`❌ ${file} - 缺失`);
                allFilesExist = false;
            }
        });

        return allFilesExist;
    }

    // 检查robots.txt内容
    checkRobotsTxt() {
        console.log('\n🤖 检查 robots.txt...');
        
        if (!fs.existsSync('robots.txt')) {
            console.log('❌ robots.txt 文件不存在');
            return false;
        }

        const content = fs.readFileSync('robots.txt', 'utf8');
        
        if (content.includes('User-agent: *')) {
            console.log('✅ robots.txt 格式正确');
            return true;
        } else {
            console.log('❌ robots.txt 格式错误');
            return false;
        }
    }

    // 检查sitemap.xml内容
    checkSitemap() {
        console.log('\n🗺️ 检查 sitemap.xml...');
        
        if (!fs.existsSync('sitemap.xml')) {
            console.log('❌ sitemap.xml 文件不存在');
            return false;
        }

        const content = fs.readFileSync('sitemap.xml', 'utf8');
        
        if (content.includes('<urlset') && content.includes('<url>')) {
            console.log('✅ sitemap.xml 格式正确');
            
            // 检查URL数量
            const urlCount = (content.match(/<url>/g) || []).length;
            console.log(`📊 包含 ${urlCount} 个URL`);
            
            return true;
        } else {
            console.log('❌ sitemap.xml 格式错误');
            return false;
        }
    }

    // 检查网站可访问性
    async checkWebsiteAccess() {
        console.log('\n🌐 检查网站可访问性...');
        
        if (!this.domain || this.domain === 'your-domain.com') {
            console.log('⚠️ 请设置正确的域名');
            return false;
        }

        return new Promise((resolve) => {
            const options = {
                hostname: this.domain,
                port: 443,
                path: '/',
                method: 'GET',
                timeout: 10000
            };

            const req = https.request(options, (res) => {
                if (res.statusCode === 200) {
                    console.log('✅ HTTPS 访问正常');
                    resolve(true);
                } else {
                    console.log(`❌ HTTPS 访问异常: ${res.statusCode}`);
                    resolve(false);
                }
            });

            req.on('error', (err) => {
                console.log(`❌ HTTPS 访问失败: ${err.message}`);
                
                // 尝试HTTP
                this.checkHttpAccess().then(resolve);
            });

            req.on('timeout', () => {
                console.log('❌ HTTPS 访问超时');
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    // 检查HTTP访问
    async checkHttpAccess() {
        return new Promise((resolve) => {
            const options = {
                hostname: this.domain,
                port: 80,
                path: '/',
                method: 'GET',
                timeout: 10000
            };

            const req = http.request(options, (res) => {
                if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
                    console.log('✅ HTTP 访问正常');
                    resolve(true);
                } else {
                    console.log(`❌ HTTP 访问异常: ${res.statusCode}`);
                    resolve(false);
                }
            });

            req.on('error', (err) => {
                console.log(`❌ HTTP 访问失败: ${err.message}`);
                resolve(false);
            });

            req.on('timeout', () => {
                console.log('❌ HTTP 访问超时');
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    // 生成部署报告
    generateReport() {
        console.log('\n📋 部署检查报告');
        console.log('='.repeat(50));
        
        const filesOk = this.checkRequiredFiles();
        const robotsOk = this.checkRobotsTxt();
        const sitemapOk = this.checkSitemap();
        
        console.log('\n📊 检查结果汇总:');
        console.log(`文件完整性: ${filesOk ? '✅ 通过' : '❌ 失败'}`);
        console.log(`robots.txt: ${robotsOk ? '✅ 通过' : '❌ 失败'}`);
        console.log(`sitemap.xml: ${sitemapOk ? '✅ 通过' : '❌ 失败'}`);
        
        if (filesOk && robotsOk && sitemapOk) {
            console.log('\n🎉 本地文件检查全部通过！');
            console.log('📤 可以上传到宝塔面板了');
        } else {
            console.log('\n⚠️ 发现问题，请修复后重新检查');
        }

        return filesOk && robotsOk && sitemapOk;
    }

    // 运行完整检查
    async runFullCheck() {
        console.log('🚀 开始 Coinmint 网站部署检查...\n');
        
        const localOk = this.generateReport();
        
        if (this.domain && this.domain !== 'your-domain.com') {
            const webOk = await this.checkWebsiteAccess();
            
            console.log('\n🌍 在线检查结果:');
            console.log(`网站访问: ${webOk ? '✅ 通过' : '❌ 失败'}`);
            
            if (localOk && webOk) {
                console.log('\n🎊 恭喜！网站部署成功！');
                console.log('🔍 建议接下来：');
                console.log('1. 提交sitemap到搜索引擎');
                console.log('2. 设置网站监控');
                console.log('3. 配置定期备份');
            }
        } else {
            console.log('\n💡 提示：设置域名后可进行在线检查');
            console.log('使用方法: node deployment-checker.js your-domain.com');
        }
    }
}

// 命令行使用
if (require.main === module) {
    const domain = process.argv[2] || 'your-domain.com';
    const checker = new DeploymentChecker(domain);
    checker.runFullCheck();
}

module.exports = DeploymentChecker;
