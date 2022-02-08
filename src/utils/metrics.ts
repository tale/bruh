import { performance, PerformanceObserver } from 'node:perf_hooks'
import { log } from 'interface'
import { config } from 'utils'

if (config.debug) {
	// Global Initialization
	const observer = new PerformanceObserver(list => {
		for (const entry of list.getEntries()) {
			log.debug('perf: %s - %sms', entry.name, entry.duration.toFixed(4))
		}
	})

	observer.observe({ entryTypes: ['measure'], buffered: true })
}

export const startMetric = (name: string) => {
	if (config.debug) {
		performance.mark(`${name}[start]`)
	}
}

export const endMetric = (name: string) => {
	if (config.debug) {
		performance.mark(`${name}[end]`)
		performance.measure(name, `${name}[start]`, `${name}[end]`)
	}
}
