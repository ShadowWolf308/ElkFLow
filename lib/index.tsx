import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ElkFlowProps } from "./types";
import ReactFlow, { BaseEdge, Edge, EdgeProps, Node, SmoothStepEdge } from "reactflow";

interface EdgeData extends Object {
	data: any;
	elkData: {
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
	const bendSection = useMemo(() => !!data?.elkData.bendSections ? data.elkData.bendSections[0] : undefined, [data?.elkData.bendSections]);

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
				data={data}
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

	const buildNodes = useCallback(async (nodes: Node[], edges: Edge[]): Promise<[Node[], Edge[]]> => {
		const elk = new (await import("elkjs/lib/elk.bundled")).default();

		const layout = await elk.layout(
			{
				id: "graph",
				children: nodes.map((node) => ({
					id: node.id,
					width: 150,
					height: 35,
					labels: [{
						text: node.data.label,
					}],
				})),
				edges: edges.map((edge) => ({
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
				const original = nodes.find((node) => node.id === n.id);

				if (!original) {
					throw new Error(`Node ${n.id} not found`);
				}

				return {
					...original,
					position: {
						x: n.x || original.position.x,
						y: n.y || original.position.y,
					},
					data: {
						...original.data,
						elkData: {
							isDragged: false,
						},
					}
				};
			}) || [],
			edges.map((edge) => {
				const found = layout.edges?.find((e) => e.id === edge.id);

				if (!found || !found.sections) {
					return edge;
				}

				return {
					...edge,
					data: {
						data: edge.data,
						elkData: {
							bendSections: found.sections,
							isDragged: false,
						},
					},
					type: "elkStep",
				};
			}),
		];
	}, []);

	const [elkNodes, setElkNodes] = useState<Node[]>([]);
	const [elkEdges, setElkEdges] = useState<Edge[]>([]);

	useEffect(() => {
		buildNodes(nodes || [], edges || []).then(([nodes, edges]) => {
			setElkNodes(nodes);
			setElkEdges(edges);
		});
	}, [nodes, edges]);

	const updateNodeOrEdgeData = useCallback((nodeOrEdge: Node | Edge) => {
		return {
			...nodeOrEdge,
			data: nodeOrEdge.data?.data,
		};
	}, []);

	return (
		<ReactFlow
			nodes={elkNodes}
			edges={elkEdges}
			onNodeClick={(e, node) => onNodeClick?.(e, updateNodeOrEdgeData(node) as Node)}
			onEdgeClick={(e, edge) => onEdgeClick?.(e, updateNodeOrEdgeData(edge) as Edge)}
			onNodesChange={(changes) => {
				onNodesChange?.(changes);
			}}
			onEdgesChange={(changes) => {
				onEdgesChange?.(changes);
			}}
			onNodesDelete={(nodes) => onNodesDelete?.(nodes.map(updateNodeOrEdgeData) as Node[])}
			onEdgesDelete={(edges) => onEdgesDelete?.(edges.map(updateNodeOrEdgeData) as Edge[])}
			onNodeContextMenu={(e, node) => onNodeContextMenu?.(e, updateNodeOrEdgeData(node) as Node)}
			onNodeDoubleClick={(e, node) => onNodeDoubleClick?.(e, updateNodeOrEdgeData(node) as Node)}
			onNodeDrag={(e, node, nodes) => onNodeDrag?.(e, updateNodeOrEdgeData(node) as Node, nodes.map(updateNodeOrEdgeData) as Node[])}
			onNodeDragStart={(e, node, nodes) => onNodeDragStart?.(e, updateNodeOrEdgeData(node) as Node, nodes.map(updateNodeOrEdgeData) as Node[])}
			onNodeDragStop={(e, node, nodes) => onNodeDragStop?.(e, updateNodeOrEdgeData(node) as Node, nodes.map(updateNodeOrEdgeData) as Node[])}
			onNodeMouseEnter={(e, node) => onNodeMouseEnter?.(e, updateNodeOrEdgeData(node) as Node)}
			onNodeMouseLeave={(e, node) => onNodeMouseLeave?.(e, updateNodeOrEdgeData(node) as Node)}
			onNodeMouseMove={(e, node) => onNodeMouseMove?.(e, updateNodeOrEdgeData(node) as Node)}
			onEdgeContextMenu={(e, edge) => onEdgeContextMenu?.(e, updateNodeOrEdgeData(edge) as Edge)}
			onEdgeDoubleClick={(e, edge) => onEdgeDoubleClick?.(e, updateNodeOrEdgeData(edge) as Edge)}
			onEdgeMouseEnter={(e, edge) => onEdgeMouseEnter?.(e, updateNodeOrEdgeData(edge) as Edge)}
			onEdgeMouseMove={(e, edge) => onEdgeMouseMove?.(e, updateNodeOrEdgeData(edge) as Edge)}
			onEdgeMouseLeave={(e, edge) => onEdgeMouseLeave?.(e, updateNodeOrEdgeData(edge) as Edge)}
			onReconnect={(edge, conn) => onReconnect?.(updateNodeOrEdgeData(edge) as Edge, conn)}
			onReconnectEnd={(e, edge, handleType) => onReconnectEnd?.(e, updateNodeOrEdgeData(edge) as Edge, handleType)}
			onReconnectStart={(e, edge, handleType) => onReconnectStart?.(e, updateNodeOrEdgeData(edge) as Edge, handleType)}
			edgeTypes={EDGE_TYPES}
			{...rest}
		/>
	);
}