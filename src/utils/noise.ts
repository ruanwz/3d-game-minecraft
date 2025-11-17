/**
 * Perlin Noise implementation for terrain generation
 * Based on Ken Perlin's improved noise algorithm
 */

export class PerlinNoise {
  private permutation: number[];
  private p: number[];

  constructor(seed: number = 0) {
    // Initialize permutation table with seed
    this.permutation = this.generatePermutation(seed);

    // Duplicate the permutation table to avoid overflow
    this.p = new Array(512);
    for (let i = 0; i < 256; i++) {
      this.p[i] = this.permutation[i];
      this.p[256 + i] = this.permutation[i];
    }
  }

  private generatePermutation(seed: number): number[] {
    const p = Array.from({ length: 256 }, (_, i) => i);

    // Seeded shuffle using simple LCG random
    const random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    return p;
  }

  private seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  private fade(t: number): number {
    // 6t^5 - 15t^4 + 10t^3
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    // Convert low 4 bits of hash code into 12 gradient directions
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * Get 3D Perlin noise value at given coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @param z Z coordinate
   * @returns Noise value between -1 and 1
   */
  noise3D(x: number, y: number, z: number): number {
    // Find unit cube that contains point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Find relative x, y, z of point in cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves for each of x, y, z
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // Hash coordinates of the 8 cube corners
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    // Add blended results from 8 corners of cube
    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }

  /**
   * Get 2D Perlin noise value at given coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Noise value between -1 and 1
   */
  noise2D(x: number, y: number): number {
    return this.noise3D(x, y, 0);
  }

  /**
   * Get fractal (multi-octave) noise value
   * @param x X coordinate
   * @param z Z coordinate
   * @param octaves Number of noise layers
   * @param persistence Amplitude multiplier for each octave (0-1)
   * @param lacunarity Frequency multiplier for each octave (>1)
   * @returns Noise value
   */
  fractalNoise2D(
    x: number,
    z: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0; // Used for normalizing result to 0-1

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, z * frequency) * amplitude;

      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

/**
 * Terrain noise generator with preset configurations
 */
export class TerrainNoise {
  private perlin: PerlinNoise;

  constructor(seed: number = 0) {
    this.perlin = new PerlinNoise(seed);
  }

  /**
   * Generate height value for terrain at given coordinates
   * @param x World X coordinate
   * @param z World Z coordinate
   * @returns Height value (0-1 range, multiply by max height)
   */
  getHeight(x: number, z: number): number {
    // Base terrain - large rolling hills
    const baseScale = 0.01;
    const baseNoise = this.perlin.fractalNoise2D(x * baseScale, z * baseScale, 4, 0.5, 2.0);

    // Detail layer - smaller variations
    const detailScale = 0.05;
    const detailNoise = this.perlin.fractalNoise2D(x * detailScale, z * detailScale, 3, 0.3, 2.5);

    // Mountain layer - high peaks
    const mountainScale = 0.005;
    const mountainNoise = this.perlin.fractalNoise2D(x * mountainScale, z * mountainScale, 5, 0.6, 2.0);

    // Combine layers
    let height = baseNoise * 0.5 + 0.5; // Normalize to 0-1
    height += detailNoise * 0.1; // Add fine details

    // Add mountains in some areas (mountain noise acts as a mask)
    const mountainMask = (mountainNoise + 1) * 0.5; // Normalize to 0-1
    height = height * (1 - mountainMask * 0.3) + mountainMask * 0.8;

    // Clamp to 0-1
    return Math.max(0, Math.min(1, height));
  }

  /**
   * Get biome type for given coordinates
   * @param x World X coordinate
   * @param z World Z coordinate
   * @returns Biome identifier (0-1 range)
   */
  getBiome(x: number, z: number): number {
    const biomeScale = 0.003;
    const biomeNoise = this.perlin.fractalNoise2D(x * biomeScale, z * biomeScale, 2, 0.5, 2.0);
    return (biomeNoise + 1) * 0.5; // Normalize to 0-1
  }

  /**
   * Get cave density for 3D cave generation
   * @param x World X coordinate
   * @param y World Y coordinate
   * @param z World Z coordinate
   * @returns Cave density (> 0.5 means air/cave)
   */
  getCaveDensity(x: number, y: number, z: number): number {
    const caveScale = 0.05;
    const density = this.perlin.noise3D(x * caveScale, y * caveScale, z * caveScale);
    return (density + 1) * 0.5; // Normalize to 0-1
  }
}
