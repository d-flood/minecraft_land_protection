import { world, system } from '@minecraft/server';

const playerPoints = new Map();
let protectedAreas = [];
const overworld = world.getDimension("overworld");

// Initialize dynamic property; i.e., persistent storage
world.getDynamicProperty('protectedAreas') ?? world.setDynamicProperty('protectedAreas', '[]');

// Load stored protected areas
system.run(() => {
    const storedAreas = world.getDynamicProperty('protectedAreas');
    protectedAreas = JSON.parse(storedAreas);
});

// Handle right clicks with stick
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    if (event.itemStack.typeId !== "minecraft:stick") return;
    
    const block = player.getBlockFromViewDirection()?.block;
    // if (!block || block.typeId !== "minecraft:gold_block") return;
    if (!block || isProtected(block, player)) return;

    let points = playerPoints.get(player.id) || [];

    points.push({ x: block.x, z: block.z });
    
    player.sendMessage(`Point ${points.length} set at (${block.x}, ${block.z})`);
    
    if (points.length === 4) {
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minZ = Math.min(...points.map(p => p.z));
        const maxZ = Math.max(...points.map(p => p.z));

        if ((maxX - minX) * (maxZ - minZ) > 2500) {
            player.sendMessage("Area too large! Max area size is 2500 blocks.");
            points = [];
            return;
        }

        playerPoints.delete(player.id);

        // delete player's existing protected areas
        protectedAreas = protectedAreas.filter(area => area.owner !== player.id);
        
        protectedAreas.push({
            owner: player.id,
            bounds: { minX, maxX, minZ, maxZ }
        });
        
        // Save updated protected areas
        world.setDynamicProperty('protectedAreas', JSON.stringify(protectedAreas));
        
        player.sendMessage("Area protected!");
        playerPoints.delete(player.id);
    } else {
        playerPoints.set(player.id, points);
    }
});

// Prevent block changes in protected areas

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (isProtected(event.block, event.player)) {
        event.cancel = true;
    }
});

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    if (isProtected(event.block, event.player)) {
        event.cancel = true;
    }
});

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    if (isProtected(event.block, event.player)) {
        event.cancel = true;
    }
});

world.beforeEvents.explosion.subscribe((event) => {
    const blocks = event.getImpactedBlocks();
    for (const block of blocks) {
        if (isProtectedArea(block)) {
            event.cancel = true;
        }
    }
});

world.beforeEvents.itemUseOn.subscribe((event) => {
    if (isProtected(event.block, event.player)) {
        event.cancel = true;
    }
});


function isProtected(block, player) {
    return protectedAreas.some(area => {
        if (block.x >= area.bounds.minX && 
            block.x <= area.bounds.maxX && 
            block.z >= area.bounds.minZ && 
            block.z <= area.bounds.maxZ) {
            return area.owner !== player.id;
        }
        return false;
    });
}

function isProtectedArea(block) {
    return protectedAreas.some(area => {
        if (block.x >= area.bounds.minX &&
            block.x <= area.bounds.maxX &&
            block.z >= area.bounds.minZ &&
            block.z <= area.bounds.maxZ) {
            return true;
        }
        return false;
    });
};

function getNearbyPlayers(area) {
    const players = world.getAllPlayers();
    const renderDistance = 64;
    
    return players.filter(player => {
        const pos = player.location;
        return pos.x >= area.bounds.minX - renderDistance &&
               pos.x <= area.bounds.maxX + renderDistance &&
               pos.z >= area.bounds.minZ - renderDistance &&
               pos.z <= area.bounds.maxZ + renderDistance;
    });
}

function isChunkLoaded(dimension, x, z) {
    try {
        dimension.getBlock({ x, y: 0, z });
        return true;
    } catch {
        return false;
    }
}

function spawnBorderParticles(area) {
    try {
        const nearbyPlayers = getNearbyPlayers(area);
        if (nearbyPlayers.length === 0) return;
        
        const { minX, maxX, minZ, maxZ } = area.bounds;
        
        for (const player of nearbyPlayers) {
            // Only spawn particles if player's chunk is loaded
            if (!isChunkLoaded(overworld, player.location.x, player.location.z)) continue;

            // eep particles at player eye level or minimum of 1 blocks above ground
            const y = Math.max(Math.floor(player.location.y), player.location.y + 1);
            
            // Calculate distance to area corners
            const dist = Math.min(
                Math.abs(player.location.x - minX) + Math.abs(player.location.z - minZ),
                Math.abs(player.location.x - maxX) + Math.abs(player.location.z - maxZ)
            );

            // Adjust particle density based on distance
            const spacing = dist < 32 ? 2 : (dist < 48 ? 4 : 6);
            
            for (let x = minX; x <= maxX; x += spacing) {
                if (isChunkLoaded(overworld, x, minZ)) {
                    overworld.spawnParticle(
                        "minecraft:basic_flame_particle",
                        { x: Math.floor(x), y, z: Math.floor(minZ) }
                    );
                }
                if (isChunkLoaded(overworld, x, maxZ)) {
                    overworld.spawnParticle(
                        "minecraft:basic_flame_particle",
                        { x: Math.floor(x), y, z: Math.floor(maxZ) }
                    );
                }
            }
            
            for (let z = minZ; z <= maxZ; z += spacing) {
                if (isChunkLoaded(overworld, minX, z)) {
                    overworld.spawnParticle(
                        "minecraft:basic_flame_particle",
                        { x: Math.floor(minX), y, z: Math.floor(z) }
                    );
                }
                if (isChunkLoaded(overworld, maxX, z)) {
                    overworld.spawnParticle(
                        "minecraft:basic_flame_particle",
                        { x: Math.floor(maxX), y, z: Math.floor(z) }
                    );
                }
            }
        }
    } catch (error) {
        console.warn("Error spawning particles:", error);
    }
}

system.runInterval(() => {
    for (const area of protectedAreas) {
        spawnBorderParticles(area);
    }
}, 10);


