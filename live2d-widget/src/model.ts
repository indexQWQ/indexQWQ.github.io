
/**
 * @file 包含与看板娘模型加载和管理相关的类
 * @module model
 */

import { showMessage } from './message.js';
import { loadExternalResource, randomOtherOption } from './utils.js';
import type Cubism2Model from './cubism2/index.js';
import type { AppDelegate as Cubism5Model } from './cubism5/index.js';
import logger, { LogLevel } from './logger.js';

// CDN模型列表接口
interface ModelListCDN {
  messages: string[];           // 模型对应的消息列表
  models: string | string[];    // 模型名称或模型名称数组
}

// 本地模型列表接口
interface ModelList {
  name: string;        // 模型名称
  paths: string[];     // 模型路径数组
  message: string;     // 模型加载时显示的消息
}

// 配置接口
interface Config {
  /**
   * 看板娘配置文件路径
   * @type {string}
   */
  waifuPath: string;
  /**
   * API路径，用于通过API加载模型
   * @type {string | undefined}
   */
  apiPath?: string;
  /**
   * CDN路径，用于通过CDN加载模型
   * @type {string | undefined}
   */
  cdnPath?: string;
  /**
   * Cubism 2核心库路径，用于加载Cubism 2模型
   * @type {string | undefined}
   */
  cubism2Path?: string;
  /**
   * Cubism 5核心库路径，用于加载Cubism 3及以后版本的模型
   * @type {string | undefined}
   */
  cubism5Path?: string;
  /**
   * 默认模型ID
   * @type {string | undefined}
   */
  modelId?: number;
  /**
   * 要显示的工具列表
   * @type {string[] | undefined}
   */
  tools?: string[];
  /**
   * 是否支持拖拽看板娘
   * @type {boolean | undefined}
   */
  drag?: boolean;
  /**
   * 日志级别
   * @type {LogLevel | undefined}
   */
  logLevel?: LogLevel;
}

/**
 * 看板娘模型管理类，负责加载和管理模型
 */
class ModelManager {
  public readonly useCDN: boolean;           // 是否使用CDN
  private readonly cdnPath: string;          // CDN路径
  private readonly cubism2Path: string;      // Cubism 2核心库路径
  private readonly cubism5Path: string;      // Cubism 5核心库路径
  private _modelId: number;                  // 当前模型ID
  private _modelTexturesId: number;          // 当前纹理ID
  private modelList: ModelListCDN | null = null;  // CDN模型列表
  private cubism2model: Cubism2Model | undefined;  // Cubism 2模型实例
  private cubism5model: Cubism5Model | undefined;  // Cubism 5模型实例
  private currentModelVersion: number;       // 当前模型版本（2或3）
  private loading: boolean;                  // 是否正在加载中
  private modelJSONCache: Record<string, any>;  // 模型JSON缓存
  private models: ModelList[];               // 本地模型列表

  /**
   * 创建模型实例（私有构造函数）
   * @param {Config} config - 配置选项
   * @param {ModelList[]} models - 本地模型列表
   */
  private constructor(config: Config, models: ModelList[] = []) {
    let { apiPath, cdnPath } = config;
    const { cubism2Path, cubism5Path } = config;
    let useCDN = false;
    
    // 配置CDN路径
    if (typeof cdnPath === 'string') {
      if (!cdnPath.endsWith('/')) cdnPath += '/';
      useCDN = true;
    } else if (typeof apiPath === 'string') {
      // 向后兼容：apiPath已弃用，使用cdnPath代替
      if (!apiPath.endsWith('/')) apiPath += '/';
      cdnPath = apiPath;
      useCDN = true;
      logger.warn('apiPath选项已弃用，请使用cdnPath代替');
    } else if (!models.length) {
      throw '初始化参数无效！';
    }
    
    // 从本地存储获取模型ID和纹理ID，或使用默认值
    let modelId: number = parseInt(localStorage.getItem('modelId') as string, 10);
    let modelTexturesId: number = parseInt(
      localStorage.getItem('modelTexturesId') as string, 10
    );
    if (isNaN(modelId) || isNaN(modelTexturesId)) {
      modelTexturesId = 0;
    }
    if (isNaN(modelId)) {
      modelId = config.modelId ?? 0;
    }
    
    // 初始化属性
    this.useCDN = useCDN;
    this.cdnPath = cdnPath || '';
    this.cubism2Path = cubism2Path || '';
    this.cubism5Path = cubism5Path || '';
    this._modelId = modelId;
    this._modelTexturesId = modelTexturesId;
    this.currentModelVersion = 0;
    this.loading = false;
    this.modelJSONCache = {};
    this.models = models;
  }

  /**
   * 静态初始化方法，用于验证配置和模型
   */
  public static async initCheck(config: Config, models: ModelList[] = []) {
    const model = new ModelManager(config, models);
    
    // 使用CDN时的初始化检查
    if (model.useCDN) {
      const response = await fetch(`${model.cdnPath}model_list.json`);
      model.modelList = await response.json();
      
      // 验证模型ID范围
      if (model.modelId >= model.modelList.models.length) {
        model.modelId = 0;
      }
      
      const modelName = model.modelList.models[model.modelId];
      if (Array.isArray(modelName)) {
        // 模型有多个纹理变体
        if (model.modelTexturesId >= modelName.length) {
          model.modelTexturesId = 0;
        }
      } else {
        // 单个模型，检查纹理缓存
        const modelSettingPath = `${model.cdnPath}model/${modelName}/index.json`;
        const modelSetting = await model.fetchWithCache(modelSettingPath);
        const version = model.checkModelVersion(modelSetting);
        if (version === 2) {
          const textureCache = await model.loadTextureCache(modelName);
          if (model.modelTexturesId >= textureCache.length) {
            model.modelTexturesId = 0;
          }
        }
      }
    } else {
      // 使用本地模型时的初始化检查
      if (model.modelId >= model.models.length) {
        model.modelId = 0;
      }
      if (model.modelTexturesId >= model.models[model.modelId].paths.length) {
        model.modelTexturesId = 0;
      }
    }
    return model;
  }

  // 模型ID的setter和getter
  public set modelId(modelId: number) {
    this._modelId = modelId;
    localStorage.setItem('modelId', modelId.toString());
  }

  public get modelId() {
    return this._modelId;
  }

  // 纹理ID的setter和getter
  public set modelTexturesId(modelTexturesId: number) {
    this._modelTexturesId = modelTexturesId;
    localStorage.setItem('modelTexturesId', modelTexturesId.toString());
  }

  public get modelTexturesId() {
    return this._modelTexturesId;
  }

  /**
   * 重置画布，用于WebGL资源回收
   */
  resetCanvas() {
    document.getElementById('waifu-canvas').innerHTML = '<canvas id="live2d" width="800" height="800"></canvas>';
  }

  /**
   * 带缓存的获取JSON数据方法
   * @param url - 要获取的URL
   * @returns JSON数据
   */
  async fetchWithCache(url: string) {
    let result;
    if (url in this.modelJSONCache) {
      // 从缓存中获取
      result = this.modelJSONCache[url];
    } else {
      // 从网络获取并缓存
      try {
        const response = await fetch(url);
        result = await response.json();
      } catch {
        result = null;
      }
      this.modelJSONCache[url] = result;
    }
    return result;
  }

  /**
   * 检查模型版本
   * @param modelSetting - 模型设置
   * @returns 模型版本（2或3）
   */
  checkModelVersion(modelSetting: any) {
    if (modelSetting.Version === 3 || modelSetting.FileReferences) {
      return 3; // Cubism 3+
    }
    return 2; // Cubism 2
  }

  /**
   * 加载Live2D模型
   * @param modelSettingPath - 模型设置文件路径
   * @param modelSetting - 模型设置对象
   */
  async loadLive2D(modelSettingPath: string, modelSetting: object) {
    if (this.loading) {
      logger.warn('仍在加载中，中止操作');
      return;
    }
    this.loading = true;
    try {
      const version = this.checkModelVersion(modelSetting);
      
      if (version === 2) {
        // 加载Cubism 2模型
        if (!this.cubism2model) {
          if (!this.cubism2Path) {
            logger.error('未设置cubism2Path，无法加载Cubism 2核心库');
            return;
          }
          await loadExternalResource(this.cubism2Path, 'js');
          const { default: Cubism2Model } = await import('./cubism2/index.js');
          this.cubism2model = new Cubism2Model();
        }
        
        // 如果当前是Cubism 3+模型，需要先释放
        if (this.currentModelVersion === 3) {
          (this.cubism5model as any).release();
          this.resetCanvas(); // 回收WebGL资源
        }
        
        // 初始化或切换模型
        if (this.currentModelVersion === 3 || !this.cubism2model.gl) {
          await this.cubism2model.init('live2d', modelSettingPath, modelSetting);
        } else {
          await this.cubism2model.changeModelWithJSON(modelSettingPath, modelSetting);
        }
      } else {
        // 加载Cubism 3+模型
        if (!this.cubism5Path) {
          logger.error('未设置cubism5Path，无法加载Cubism 5核心库');
          return;
        }
        await loadExternalResource(this.cubism5Path, 'js');
        const { AppDelegate: Cubism5Model } = await import('./cubism5/index.js');
        this.cubism5model = new (Cubism5Model as any)();
        
        // 如果当前是Cubism 2模型，需要先销毁
        if (this.currentModelVersion === 2) {
          this.cubism2model.destroy();
          this.resetCanvas(); // 回收WebGL资源
        }
        
        // 初始化或切换模型
        if (this.currentModelVersion === 2 || !this.cubism5model.subdelegates.at(0)) {
          // 注释掉 initialize 调用，直接调用 changeModel 和 run
          // this.cubism5model.initialize();
          this.cubism5model.changeModel(modelSettingPath);
          this.cubism5model.run();
        } else {
          this.cubism5model.changeModel(modelSettingPath);
        }
      }
      
      logger.info(`模型 ${modelSettingPath} (Cubism版本 ${version}) 加载成功`);
      this.currentModelVersion = version;
    } catch (err) {
      console.error('loadLive2D失败', err);
    }
    this.loading = false;
  }

  /**
   * 加载纹理缓存
   * @param modelName - 模型名称
   * @returns 纹理缓存数组
   */
  async loadTextureCache(modelName: string): Promise<any[]> {
    const textureCache = await this.fetchWithCache(`${this.cdnPath}model/${modelName}/textures.cache`);
    return textureCache || [];
  }

  /**
   * 加载指定模型
   * @param {string | string[]} message - 加载时显示的消息
   */
  async loadModel(message: string | string[]) {
    let modelSettingPath, modelSetting;
    
    if (this.useCDN) {
      // 使用CDN加载模型
      let modelName = this.modelList.models[this.modelId];
      if (Array.isArray(modelName)) {
        modelName = modelName[this.modelTexturesId];
      }
      modelSettingPath = `${this.cdnPath}model/${modelName}/index.json`;
      modelSetting = await this.fetchWithCache(modelSettingPath);
      
      // 对于Cubism 2模型，需要设置纹理
      const version = this.checkModelVersion(modelSetting);
      if (version === 2) {
        const textureCache = await this.loadTextureCache(modelName);
        if (textureCache.length > 0) {
          let textures = textureCache[this.modelTexturesId];
          if (typeof textures === 'string') textures = [textures];
          modelSetting.textures = textures;
        }
      }
    } else {
      // 使用本地模型
      modelSettingPath = this.models[this.modelId].paths[this.modelTexturesId];
      modelSetting = await this.fetchWithCache(modelSettingPath);
    }
    
    await this.loadLive2D(modelSettingPath, modelSetting);
    showMessage(message, 4000, 10);
  }

  /**
   * 为当前模型加载随机纹理
   * @param successMessage - 成功时显示的消息
   * @param failMessage - 失败时显示的消息
   */
  async loadRandTexture(successMessage: string | string[] = '', failMessage: string | string[] = '') {
    const { modelId } = this;
    let noTextureAvailable = false;
    
    if (this.useCDN) {
      const modelName = this.modelList.models[modelId];
      if (Array.isArray(modelName)) {
        // 模型有多个纹理变体
        this.modelTexturesId = randomOtherOption(modelName.length, this.modelTexturesId);
      } else {
        // 单个模型，检查纹理缓存
        const modelSettingPath = `${this.cdnPath}model/${modelName}/index.json`;
        const modelSetting = await this.fetchWithCache(modelSettingPath);
        const version = this.checkModelVersion(modelSetting);
        if (version === 2) {
          const textureCache = await this.loadTextureCache(modelName);
          if (textureCache.length <= 1) {
            noTextureAvailable = true;
          } else {
            this.modelTexturesId = randomOtherOption(textureCache.length, this.modelTexturesId);
          }
        } else {
          noTextureAvailable = true;
        }
      }
    } else {
      // 本地模型
      if (this.models[modelId].paths.length === 1) {
        noTextureAvailable = true;
      } else {
        this.modelTexturesId = randomOtherOption(this.models[modelId].paths.length, this.modelTexturesId);
      }
    }
    
    if (noTextureAvailable) {
      showMessage(failMessage, 4000, 10);
    } else {
      await this.loadModel(successMessage);
    }
  }

  /**
   * 加载下一个角色模型
   */
  async loadNextModel() {
    this.modelTexturesId = 0; // 重置纹理ID
    
    if (this.useCDN) {
      this.modelId = (this.modelId + 1) % this.modelList.models.length;
      await this.loadModel(this.modelList.messages[this.modelId]);
    } else {
      this.modelId = (this.modelId + 1) % this.models.length;
      await this.loadModel(this.models[this.modelId].message);
    }
  }
}

export { ModelManager, Config, ModelList };
