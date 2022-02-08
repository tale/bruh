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

// Metric functions should only be void because the intention is to test scoped code
export const observeMetric = (metricName: string, metricOperation: () => void) => {
	if (config.debug) {
		performance.mark(`${metricName}[start]`)
		metricOperation()
		performance.mark(`${metricName}[end]`)
		performance.measure(metricName, `${metricName}[start]`, `${metricName}[end]`)
	} else {
		metricOperation()
	}
}
