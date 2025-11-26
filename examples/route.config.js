import navConfig from './component.router';
import guideNavs from './guide.router';
import langs from './i18n/route';

const LOAD_MAP = {
  'zh-CN': name => {
    return r => require.ensure([], () =>
      r(require(`./pages/zh-CN/${name}.vue`)),
    'zh-CN');
  }
};

const load = function(lang, path) {
  return LOAD_MAP[lang](path);
};

const LOAD_DOCS_MAP = {
  'zh-CN': path => {
    return r => require.ensure([], () =>
      r(require(`./docs/zh-CN${path}.md`)),
    'zh-CN');
  }
};

const loadDocs = function(lang, path) {
  return LOAD_DOCS_MAP[lang](path);
};

const getFirstComponentPath = (lang) => {
  const navs = navConfig[lang] || [];
  for (let i = 0; i < navs.length; i++) {
    const section = navs[i];
    if (section.groups && section.groups.length) {
      for (let j = 0; j < section.groups.length; j++) {
        const group = section.groups[j];
        if (group.list && group.list.length) return group.list[0].path;
      }
    }
    if (section.children && section.children.length) {
      return section.children[0].path;
    }
  }
  return '/installation';
};

const registerRoute = (navConfig) => {
  let route = [];
  const langList = langs.map(l => l.lang);
  langList.forEach((lang, index) => {
    let navs = navConfig[lang] || [];
    route.push({
      path: `/${ lang }/component`,
      redirect: `/${ lang }/component${ getFirstComponentPath(lang) }`,
      component: load(lang, 'component'),
      children: []
    });
    navs.forEach(nav => {
      if (nav.href) return;
      if (nav.groups) {
        nav.groups.forEach(group => {
          group.list.forEach(nav => {
            addRoute(nav, lang, index);
          });
        });
      } else if (nav.children) {
        nav.children.forEach(nav => {
          addRoute(nav, lang, index);
        });
      } else {
        addRoute(nav, lang, index);
      }
    });
  });
  function addRoute(page, lang, index) {
    const component = page.path === '/changelog'
      ? load(lang, 'changelog')
      : loadDocs(lang, page.path);
    let child = {
      path: page.path.slice(1),
      meta: {
        title: page.title || page.name,
        description: page.description,
        lang
      },
      name: 'component-' + lang + (page.title || page.name),
      component: component.default || component
    };

    route[index].children.push(child);
  }

  return route;
};

let route = registerRoute(navConfig);

const generateMiscRoutes = function(lang) {
  let guideRoute = {
    path: `/${ lang }/guide`, // 指南
    redirect: `/${ lang }/guide/design`,
    component: load(lang, 'guide'),
    children: [{
      path: 'design', // 设计原则
      name: 'guide-design' + lang,
      meta: { lang },
      component: load(lang, 'design')
    }, {
      path: 'nav', // 导航
      name: 'guide-nav' + lang,
      meta: { lang },
      component: load(lang, 'nav')
    }]
  };

  const guideList = guideNavs[lang] || [];
  guideList.forEach(item => {
    if (item.children && item.children.length) {
      item.children.forEach(child => {
        const childPath = child.path.slice(1);
        guideRoute.children.push({
          path: childPath,
          name: `guide-${childPath}-${lang}`,
          meta: { lang },
          component: loadDocs(lang, child.path)
        });
      });
    } else if (item.path) {
      const p = item.path.slice(1);
      const isChangelog = item.path === '/changelog';
      guideRoute.children.push({
        path: p,
        name: `guide-${p}-${lang}`,
        meta: { lang },
        component: isChangelog ? load(lang, 'changelog') : loadDocs(lang, item.path)
      });
    }
  });

  let themeRoute = {
    path: `/${ lang }/theme`,
    component: load(lang, 'theme-nav'),
    children: [
      {
        path: '/', // 主题管理
        name: 'theme' + lang,
        meta: { lang },
        component: load(lang, 'theme')
      },
      {
        path: 'preview', // 主题预览编辑
        name: 'theme-preview-' + lang,
        meta: { lang },
        component: load(lang, 'theme-preview')
      }]
  };

  let resourceRoute = {
    path: `/${ lang }/resource`, // 资源
    meta: { lang },
    name: 'resource' + lang,
    component: load(lang, 'resource')
  };

  let indexRoute = {
    path: `/${ lang }`, // 首页
    meta: { lang },
    name: 'home' + lang,
    component: load(lang, 'index')
  };

  return [guideRoute, resourceRoute, themeRoute, indexRoute];
};

langs.forEach(lang => {
  route = route.concat(generateMiscRoutes(lang.lang));
});

route.push({
  path: '/play',
  name: 'play',
  component: require('./play/index.vue')
});

let defaultPath = '/zh-CN';

route = route.concat([{
  path: '/',
  redirect: defaultPath
}, {
  path: '*',
  redirect: defaultPath
}]);

export default route;
