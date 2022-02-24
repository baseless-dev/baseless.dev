export function ucs2length(s) {
    let result = 0;
    let length = s.length;
    let index = 0;
    let charCode;
    while (index < length) {
        result++;
        charCode = s.charCodeAt(index++);
        if (charCode >= 55296 && charCode <= 56319 && index < length) {
            charCode = s.charCodeAt(index);
            if ((charCode & 64512) == 56320) {
                index++;
            }
        }
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWNzMi1sZW5ndGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1Y3MyLWxlbmd0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQSxNQUFNLFVBQVUsVUFBVSxDQUFDLENBQVM7SUFDbkMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUN0QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZCxJQUFJLFFBQWdCLENBQUM7SUFDckIsT0FBTyxLQUFLLEdBQUcsTUFBTSxFQUFFO1FBQ3RCLE1BQU0sRUFBRSxDQUFDO1FBQ1QsUUFBUSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNqQyxJQUFJLFFBQVEsSUFBSSxNQUFNLElBQUksUUFBUSxJQUFJLE1BQU0sSUFBSSxLQUFLLEdBQUcsTUFBTSxFQUFFO1lBRS9ELFFBQVEsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksTUFBTSxFQUFFO2dCQUVsQyxLQUFLLEVBQUUsQ0FBQzthQUNSO1NBQ0Q7S0FDRDtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogR2V0IFVDUy0yIGxlbmd0aCBvZiBhIHN0cmluZ1xuICogaHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2RpbmdcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9iZXN0aWVqcy9wdW55Y29kZS5qcyAtIHB1bnljb2RlLnVjczIuZGVjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1Y3MybGVuZ3RoKHM6IHN0cmluZykge1xuXHRsZXQgcmVzdWx0ID0gMDtcblx0bGV0IGxlbmd0aCA9IHMubGVuZ3RoO1xuXHRsZXQgaW5kZXggPSAwO1xuXHRsZXQgY2hhckNvZGU6IG51bWJlcjtcblx0d2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG5cdFx0cmVzdWx0Kys7XG5cdFx0Y2hhckNvZGUgPSBzLmNoYXJDb2RlQXQoaW5kZXgrKyk7XG5cdFx0aWYgKGNoYXJDb2RlID49IDB4ZDgwMCAmJiBjaGFyQ29kZSA8PSAweGRiZmYgJiYgaW5kZXggPCBsZW5ndGgpIHtcblx0XHRcdC8vIGhpZ2ggc3Vycm9nYXRlLCBhbmQgdGhlcmUgaXMgYSBuZXh0IGNoYXJhY3RlclxuXHRcdFx0Y2hhckNvZGUgPSBzLmNoYXJDb2RlQXQoaW5kZXgpO1xuXHRcdFx0aWYgKChjaGFyQ29kZSAmIDB4ZmMwMCkgPT0gMHhkYzAwKSB7XG5cdFx0XHRcdC8vIGxvdyBzdXJyb2dhdGVcblx0XHRcdFx0aW5kZXgrKztcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn1cbiJdfQ==