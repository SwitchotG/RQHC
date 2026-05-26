import { createWebHistory, createRouter } from "vue-router";
import Home from "@/components/Home.vue"
import Map from "@/components/Map.vue"

const routes = [
	{
		name: "Home",
		path: "/",
		component: Home
	},
	{
		name: "map",
		path: "/map",
		component: Map
	},
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router;