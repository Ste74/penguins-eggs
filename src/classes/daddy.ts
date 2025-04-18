/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Settings from '../classes/settings'
import Ovary from '../classes/ovary'
import Compressors from '../classes/compressors'
import inquirer = require('inquirer')
import { IConfig } from '../interfaces'
import yaml from 'js-yaml'
import fs = require('fs')

import { IMyAddons } from '../interfaces'
import chalk from 'chalk'

import { exec } from '../lib/utils'

interface editConf {
  snapshot_basename: string
  snapshot_prefix: string
  user_opt: string
  user_opt_passwd: string
  root_passwd: string
  theme: string
  compression: string
}

export default class Daddy {
  settings = {} as Settings

  async helpMe(loadDefault = false, verbose = false) {
    // Controllo configurazione
    if (!Pacman.configurationCheck()) {
      console.log('- creating configuration dir...')
      await Pacman.configurationInstall(verbose)
    }

    // Controllo prerequisites
    if (!(await Pacman.prerequisitesCheck())) {
      console.log('- installing prerequisites...')
      await Pacman.prerequisitesInstall(verbose)
    }

    // Templates
    if (!Pacman.distroTemplateCheck()) {
      console.log('- distro template install...')
      await Pacman.distroTemplateInstall(verbose)
    }

    // show and edit configuration
    this.settings = new Settings()
    let config = {} as IConfig
    if (await this.settings.load()) {
      config = this.settings.config
      let jsonConf: string
      if (!loadDefault) {
        jsonConf = await this.editConfig(config)
      } else {
        if (config.snapshot_prefix === '') {
          config.snapshot_prefix = Utils.snapshotPrefix(this.settings.distro.distroId, this.settings.distro.versionId)
          config.compression = 'fast'
        }

        jsonConf = JSON.stringify(config)
      }

      const newConf = JSON.parse(jsonConf)

      // salvo le modifiche
      config.snapshot_basename = newConf.snapshot_basename
      config.snapshot_prefix = newConf.snapshot_prefix
      config.user_opt = newConf.user_opt
      config.user_opt_passwd = newConf.user_opt_passwd
      config.root_passwd = newConf.root_passwd
      config.theme = newConf.theme

      /**
       * Analisi del tipo di compressione del kernel
       *
       */
      const compressors = new Compressors()
      await compressors.populate()
      let fastest = 'gzip'
      if (compressors.isEnabled.zstd) {
        fastest = 'zstd -Xcompression-level 1 -b 262144'
      } else if (compressors.isEnabled.lz4) {
        fastest = 'lz4'
      }

      switch (newConf.compression) {
        case 'fast': {
          config.compression = fastest

          break
        }

        case 'normal': {
          config.compression = 'xz'

          break
        }

        case 'max': {
          const filter = 'x86'
          if (process.arch === 'armel') {
            const filter = 'ARM'
          }

          config.compression = 'xz -Xbcj ' + filter

          break
        }
        // No default
      }

      await this.settings.save(config)

      let flags = ''
      if (loadDefault) {
        await exec(`rm ${this.settings.work_dir.path} -rf`)
        await exec(`rm ${this.settings.config.snapshot_dir} -rf`)
      } else {
        // Controllo se serve il kill
        if (verbose) {
          flags = '--verbose '
        }

        Utils.titles('kill' + flags)
        console.log(chalk.cyan('Daddy, what else did you leave for me?'))
        await this.settings.listFreeSpace()
        if (await Utils.customConfirm()) {
          await exec(`rm ${this.settings.work_dir.path} -rf`)
          await exec(`rm ${this.settings.config.snapshot_dir} -rf`)
        }
      }

      /**
       * produce
       */
      if (loadDefault) {
        flags += ' --verbose'
        verbose = true
      }

      flags += ' --' + newConf.compression
      flags += ' --theme=' + config.theme
      Utils.titles('produce' + ' ' + flags)
      console.log(chalk.cyan('Daddy, what else did you leave for me?'))
      const myAddons = {} as IMyAddons
      const backup = false
      const scriptOnly = false
      const yolkRenew = false
      const final = false
      const ovary = new Ovary(config.snapshot_prefix, config.snapshot_basename, config.theme, config.compression)
      Utils.warning('Produce an egg...')
      if (await ovary.fertilization()) {
        await ovary.produce(backup, scriptOnly, yolkRenew, final, myAddons, verbose)
        ovary.finished(scriptOnly)
      }
    }
  }

  /**
   *
   * @param c
   */
  editConfig(c: IConfig): Promise<string> {
    console.log(chalk.cyan('Edit and save LiveCD parameters'))
    let compressionOpt = 0
    if (c.compression === 'xz') {
      compressionOpt = 1
    } else if (c.compression === 'xz -Xbcj x86') {
      compressionOpt = 2
    }

    if (c.snapshot_prefix === '') {
      c.snapshot_prefix = Utils.snapshotPrefix(this.settings.distro.distroId, this.settings.distro.versionId)
    }

    return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
        {
          type: 'input',
          name: 'snapshot_prefix',
          message: 'LiveCD iso prefix: ',
          default: c.snapshot_prefix
        },
        {
          type: 'input',
          name: 'snapshot_basename',
          message: 'LiveCD iso basename: ',
          default: c.snapshot_basename
        },
        {
          type: 'input',
          name: 'user_opt',
          message: 'LiveCD user:',
          default: c.user_opt
        },
        {
          type: 'input',
          name: 'user_opt_passwd',
          message: 'LiveCD user password: ',
          default: c.user_opt_passwd
        },
        {
          type: 'input',
          name: 'root_passwd',
          message: 'LiveCD root password: ',
          default: c.root_passwd
        },
        {
          type: 'input',
          name: 'theme',
          message: 'LiveCD theme: ',
          default: c.theme
        },
        {
          type: 'list',
          name: 'compression',
          message: 'LiveCD compression: ',
          choices: ['fast', 'normal', 'max'],
          default: compressionOpt
        }
      ]
      inquirer.prompt(questions).then(function (options) {
        resolve(JSON.stringify(options))
      })
    })
  }
}
