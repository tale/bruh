import { log } from 'interface'
import { config } from 'utils'

type perf_metric = {
	start: number;
	end?: number;
}

const perf_map = config.debug ? new Map<string, perf_metric>() : undefined

export function start(name: string) {
	if (!config.debug || !perf_map) {
		return
	}

	const start = performance.now()
	perf_map.set(name, { start })
}

export function end(name: string) {
	if (!config.debug || !perf_map) {
		return
	}

	const metric = perf_map.get(name)
	if (!metric) {
		throw new Error(`Metric ${name} not started`)
	}

	if (metric.end) {
		throw new Error(`Metric ${name} already ended`)
	}

	const end = performance.now()
	perf_map.set(name, { ...metric, end })

	const diff = end - metric.start
	log.debug('perf: %s - %s', name, ''.dim(`${diff.toFixed(4)}ms`))
}

export function dump() {
	if (!config.debug || !perf_map) {
		return
	}

	log.blank()
	log.debug('perf: complete metric breakdown %s', ''.dim(`(${perf_map.size} metrics)`))
	for (const [id, perf_metric] of perf_map) {
		if (!perf_metric.end) {
			log.debug('perf: %s - %sms', id, 'not ended')
			continue
		}

		const diff = perf_metric.end - perf_metric.start
		log.debug('perf: %s - %s', id, ''.dim(`${diff.toFixed(4)}ms`))
	}
}
