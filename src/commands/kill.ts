/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'

import fs = require('fs')
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import { IWorkDir } from '../interfaces/i-workdir'

import { exec } from '../lib/utils'

export default class Kill extends Command {
  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string
  work_dir = {} as IWorkDir

  static description = 'kill the eggs/free the nest'

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static examples = ['$ eggs kill\nkill the eggs/free the nest']

  async run(): Promise<void> {
    await Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Kill)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const echo = Utils.setEcho(verbose)

    if (Utils.isRoot(this.id)) {
      // Utils.warning('Cleaning the nest...')
      const settings = new Settings()
      await settings.load()
      await settings.listFreeSpace()
      if (await Utils.customConfirm()) {
        await exec(`rm ${settings.work_dir.path} -rf`, echo)
        await exec(`rm ${settings.config.snapshot_dir} -rf`, echo)
      }
    }
  }
}
