'use strict'
import inquirer = require('inquirer')

export default async function getNetmask(initial: string): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'netmask',
        message: 'What is netmask of this computer? ',
        default: initial
      }
    ]

    inquirer.prompt(questions).then(function (options) {
      resolve(options.netmask)
    })
  })
}
