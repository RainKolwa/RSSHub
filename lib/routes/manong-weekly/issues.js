const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const url = 'https://weekly.manong.io/issues/';
    const response = await got({
        rejectUnauthorized: false,
        method: 'get',
        url,
    });
    const $ = cheerio.load(response.data);
    const latest = $('.issue').slice(0, 3).get();
    const result = await Promise.all(
        latest.map((item) => {
            const el = $(item);
            const link = el.find('.h4 a').attr('href');
            const href = $(item).find('a').attr('href');
            return ctx.cache.tryGet(href, async () => {
                const response = await got({
                    method: 'get',
                    url: href,
                    Headers: {
                        Referer: url,
                    },
                });
                const $$ = cheerio.load(response.data);
                const des = $$('body');
                const title = $$('h1').text();
                const h2 = $$('h2')
                    .text()
                    .match(/（(.*)）/);
                des.find('img').remove();
                des.find('h1').remove();
                des.find('h2').remove();
                des.children().first('p').remove();
                return {
                    title,
                    link,
                    description: des.html(),
                    pubDdate: h2[1],
                };
            });
        })
    );

    ctx.state.data = {
        title: '码农周刊',
        link: url,
        item: result,
    };
};
