import React from "react";
import { createRoot } from "react-dom/client";
import { Background, Edge, Node, ReactFlowProvider, useReactFlow } from "reactflow";
import { ElkFlow } from "../lib";
import "reactflow/dist/style.css";

const root = document.getElementById('root')!;

const DEFAULT_NODE_PROPS = {
	position: {
		x: 0,
		y: 0,
	},
	deletable: false,
	draggable: false,
} as const;

const DEFAULT_EDGE_PROPS = {
	deletable: false,
	type: "smoothstep",
} as const;


const nodes: Node[] = [
	{
		...DEFAULT_NODE_PROPS,
		id: "1",
		data: {
			label: 'Node 1',
		},
	},
	{
		...DEFAULT_NODE_PROPS,
		id: "2a",
		data: {
			label: 'Node 2A',
		},
	},
	{
		...DEFAULT_NODE_PROPS,
		id: "2b",
		data: {
			label: 'Node 2B',
		},
	},
	{
		...DEFAULT_NODE_PROPS,
		id: "3a",
		data: {
			label: 'Node 3A',
		},
	},
	{
		...DEFAULT_NODE_PROPS,
		id: "3b",
		data: {
			label: 'Node 3B',
		},
	},
	{
		...DEFAULT_NODE_PROPS,
		id: "3c",
		data: {
			label: 'Node 3C',
		},
	},
	{
		...DEFAULT_NODE_PROPS,
		id: "4",
		data: {
			label: 'Node 4',
		},
	},
	{
		...DEFAULT_NODE_PROPS,
		id: "endA",
		data: {
			label: 'End node A',
		},
	},
	{
		...DEFAULT_NODE_PROPS,
		id: "endB",
		data: {
			label: 'End node B',
		},
	},
];

const edges: Edge[] = [
	{
		...DEFAULT_EDGE_PROPS,
		id: "e1-2a",
		source: "1",
		target: "2a",
		label: "Ja",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e1-2b",
		source: "1",
		target: "2b",
		label: "Nee",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e2a-endA",
		source: "2a",
		target: "endA",
		label: "Ja",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e2a-3a",
		source: "2a",
		target: "3a",
		label: "Nee",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e3a-endA",
		source: "3a",
		target: "endA",
		label: "Ja",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e2b-3a",
		source: "2b",
		target: "3a",
		label: "Wel",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e2b-3b",
		source: "2b",
		target: "3b",
		label: "Niet",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e2b-3c",
		source: "2b",
		target: "3c",
		label: "Geen idee",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e3a-endB",
		source: "3a",
		target: "endB",
		label: "Ja",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e3b-endB",
		source: "3b",
		target: "endB",
		label: "Nee",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e3b-4",
		source: "3b",
		target: "4",
		label: "Ja",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e3c-endB",
		source: "3c",
		target: "endB",
		label: "Ja",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e3c-4",
		source: "3c",
		target: "4",
		label: "Nee",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e4-endA",
		source: "4",
		target: "endA",
		label: "Ja",
	},
	{
		...DEFAULT_EDGE_PROPS,
		id: "e4-endB",
		source: "4",
		target: "endB",
		label: "Nee",
	},
]

function Elk() {
	const { fitView } = useReactFlow();

	return (
		<div
			style={{
				width: '100vw',
				height: '100vh',
				margin: 0,
				padding: 0,
			}}
		>
			<ElkFlow
				onContextMenu={(e) => {
					e.preventDefault();
				}}
				nodes={nodes}
				edges={edges}
			>
				<Background
					color="black"
				/>
			</ElkFlow>
		</div>
	)
}

function Main() {
	return (
		<ReactFlowProvider>
			<Elk />
		</ReactFlowProvider>
	);
}

createRoot(root).render(<Main />);