/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Utils from '../classes/utils'
import Daddy from '../classes/daddy'
import chalk = require('chalk')

import { exec } from '../lib/utils'

export default class Dad extends Command {
  static description = 'ask help from daddy - configuration helper'

  static flags = {
    help: Flags.help({ char: 'h' }),
    clean: Flags.boolean({ char: 'c', description: 'remove old configuration before to create' }),
    default: Flags.boolean({ char: 'd', description: 'remove old configuration and force default' }),
    verbose: Flags.boolean({ char: 'v' })
  }

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)
    console.log(chalk.cyan('Daddy, what else did you leave for me?'))
    const { flags } = await this.parse(Dad)
    if (Utils.isRoot(this.id)) {
      if (flags.clean || flags.default) {
        await exec('rm /etc/penguins-eggs.d -rf')
      }

      const daddy = new Daddy()
      daddy.helpMe(flags.default, flags.verbose)
    }
  }
}
