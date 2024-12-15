class CreateShapes < ActiveRecord::Migration[7.0]
  def change
    create_table :shapes do |t|
      t.integer :x, null: false
      t.integer :y, null: false
      t.integer :width, null: false
      t.integer :height, null: false
      t.string :type, null: false
      t.timestamps
    end
  end
end
