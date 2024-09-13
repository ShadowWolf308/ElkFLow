import React, { useCallback, useMemo, useRef } from "react";
import { ElkFlowProps } from "./types";
import ReactFlow, { BaseEdge, EdgeProps, SmoothStepEdge } from "reactflow";

interface EdgeData extends Object {
	extra: any;
	bends: {
		bendSections: import("elkjs/lib/elk.bundled").ElkEdgeSection[];
		isDragged: boolean;
	}
}

function ElkStepEdge({
	sourceX,
	sourceY,
	targetX,
	targetY,
	data,
	...rest
}: EdgeProps<EdgeData>) {
	const bendSection = useMemo(() => !!data?.bends.bendSections ? data.bends.bendSections[0] : undefined, [data?.bends.bendSections]);

	const edgePath = useMemo(() => {
		if (!bendSection) {
			return `M${sourceX},${sourceY} L${targetX},${targetY}`;
		}

		const bendRadius = 4;

		const bends: string = bendSection.bendPoints?.map((v, index, arr) => {
			const lastSection = arr[index - 1] ?? bendSection.startPoint;
			const nextSection = arr[index + 1] ?? bendSection.endPoint;

			if (
				v.x === lastSection.x &&
				nextSection.x > v.x
			) {
				// bends to the left
				return `L${v.x},${v.y - bendRadius} Q${v.x},${v.y}, ${v.x + bendRadius},${v.y}`;
			} else if (
				v.x === lastSection.x &&
				nextSection.x < v.x
			) {
				// bends to the right
				return `L${v.x},${v.y - bendRadius} Q${v.x},${v.y}, ${v.x - bendRadius},${v.y}`;
			} else if (
				v.y === lastSection.y &&
				nextSection.y > v.y
			) {
				if (v.x < lastSection.x) {
					// bends down from the right
					return `L${v.x + bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y + bendRadius}`;
				}

				// bends down from the left
				return `L${v.x - bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y + bendRadius}`;
			}

			return `L${v.x},${v.y}`;
		}).join(' ') || "";

		return `M${bendSection.startPoint.x},${bendSection.startPoint.y} ${bends} L${bendSection.endPoint.x},${bendSection.endPoint.y}`;
	}, [bendSection]);

	const labelPosition = useMemo(() => {
		if (!bendSection) {
			return {
				x: sourceX + (targetX - sourceX) / 2,
				y: sourceY + (targetY - sourceY) / 2,
			};
		}

		const position = {
			x: bendSection.startPoint.x + (bendSection.endPoint.x - bendSection.startPoint.x) / 2,
			y: bendSection.startPoint.y + (bendSection.endPoint.y - bendSection.startPoint.y) / 2,
		};
	
		if (bendSection.bendPoints && bendSection.bendPoints.length > 0) {
			const firstMiddleBendLocation = Math.floor(bendSection.bendPoints.length / 2) - 1;
			const firstMiddleBend = bendSection.bendPoints[firstMiddleBendLocation];
			const lastMiddleBendLocation = Math.ceil(bendSection.bendPoints.length / 2) - 1;
			const lastMiddleBend = lastMiddleBendLocation === firstMiddleBendLocation ? bendSection.bendPoints[lastMiddleBendLocation + 1] : bendSection.bendPoints[lastMiddleBendLocation];
	
			position.x = firstMiddleBend.x + (lastMiddleBend.x - firstMiddleBend.x) / 2;
			position.y = firstMiddleBend.y + (lastMiddleBend.y - firstMiddleBend.y) / 2;
		}

		return position;
	}, [bendSection]);

	if (!bendSection) {
		return (
			<SmoothStepEdge
				{...rest}
				data={data?.extra}
				sourceX={sourceX}
				sourceY={sourceY}
				targetX={targetX}
				targetY={targetY}
			/>
		);
	}

	return (
		<BaseEdge
			{...rest}
			path={edgePath}
			labelX={labelPosition.x}
			labelY={labelPosition.y}
		/>
	);
}

export function ElkFlow({
	nodes,
	edges,
	onNodeClick,
	onNodesChange,
	onNodeContextMenu,
	onNodeDoubleClick,
	onNodeDrag,
	onNodeDragStart,
	onNodeDragStop,
	onNodeMouseEnter,
	onNodeMouseLeave,
	onNodeMouseMove,
	onNodesDelete,
	onEdgeClick,
	onEdgesChange,
	onEdgeContextMenu,
	onEdgeDoubleClick,
	onEdgeMouseEnter,
	onEdgeMouseMove,
	onEdgeMouseLeave,
	onEdgesDelete,
	onReconnect,
	onReconnectEnd,
	onReconnectStart,
	...rest
}: ElkFlowProps) {
	const { current: EDGE_TYPES } = useRef({
		elkStep: ElkStepEdge,
	});

	const buildNodes = useCallback(async () => {
		const elk = new (await import("elkjs/lib/elk.bundled")).default();

		const layout = await elk.layout(
			{
				id: "graph",
				children: (nodes || []).map((node) => ({
					id: node.id,
					width: 150,
					height: 50,
					labels: [{
						text: node.data.label,
					}],
				})),
				edges: (edges || []).map((edge) => ({
					id: edge.id,
					sources: [edge.source],
					targets: [edge.target],
				})),
			},
			{
				layoutOptions: {
					'elk.algorithm': 'layered',
					'elk.layered.spacing.nodeNodeBetweenLayers': '80',
					'elk.spacing.nodeNode': '80',
					'elk.direction': 'DOWN',
				},
			},
		);

		return [
			layout.children?.map((n) => {
				const original = (nodes || []).find((node) => node.id === n.id);

				if (!original) {
					throw new Error(`Node ${n.id} not found`);
				}

				return {
					...original,
					position: {
						x: n.x || original.position.x,
						y: n.y || original.position.y,
					},
				};
			}) || [],
			(edges || []).map((edge) => {
				const found = layout.edges?.find((e) => e.id === edge.id);

				if (!found || !found.sections) {
					return edge;
				}

				return {
					...edge,
					data: {
						extra: edge.data,
						bends: {
							bendSections: found.sections,
							isDragged: false,
						},
					},
					type: "elkStep",
				};
			}),
		];
	}, []);

	return (
		<ReactFlow
			// nodes={nodes}
			// edges={edges}
			onNodeClick={(e, node) => {
				
			}}
			onEdgeClick={(e, edge) => {

			}}
			// onNodesChange={onNodesChange}
			// onEdgesChange={onEdgesChange}
			edgeTypes={EDGE_TYPES}
			{...rest}
		/>
	);
}